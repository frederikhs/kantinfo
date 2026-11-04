package main

import (
	"kantinfo/internal/persistence"
	"kantinfo/internal/rest/controller"
	"kantinfo/internal/rest/middleware"
	"kantinfo/internal/service"
	"log"
	"sync/atomic"
	"time"
	_ "time/tzdata"

	"github.com/gin-gonic/gin"
)

const (
	syncInterval     = 4 * time.Hour
	busySyncInterval = 10 * time.Minute
)

// nextMenuSync caps each wait at the next window boundary so the four-hour
// interval cannot skip the morning checks. The window follows Copenhagen time.
func nextMenuSync(now time.Time, location *time.Location) time.Time {
	now = now.In(location)
	start := time.Date(now.Year(), now.Month(), now.Day(), 9, 0, 0, 0, location)
	end := time.Date(now.Year(), now.Month(), now.Day(), 11, 0, 0, 0, location)

	interval := syncInterval
	boundary := start
	switch {
	case now.Before(start):
	case now.Before(end):
		interval = busySyncInterval
		boundary = end
	default:
		boundary = start.AddDate(0, 0, 1)
	}

	next := now.Add(interval)
	if next.After(boundary) {
		return boundary
	}
	return next
}

func main() {
	location, err := time.LoadLocation("Europe/Copenhagen")
	if err != nil {
		log.Fatalf("load menu sync timezone: %v", err)
	}

	db := persistence.NewDB()
	db.CreateTables()

	var nextSyncAt atomic.Int64
	getNextSyncAt := func() time.Time {
		n := nextSyncAt.Load()
		if n == 0 {
			return time.Time{}
		}

		return time.Unix(0, n)
	}

	go func() {
		for {
			service.SyncData(db)
			nextSync := nextMenuSync(time.Now(), location)
			nextSyncAt.Store(nextSync.UnixNano())
			time.Sleep(time.Until(nextSync))
		}
	}()

	r := gin.Default()
	r.Use(middleware.SetupCors("*"))

	api := r.Group("/api/v2", middleware.CacheUntil(getNextSyncAt))
	api.GET("/menu/next", controller.GetMenuItemsNext(db))
	api.GET("/menu/:date", controller.GetMenuItemsForDateByRouteParam(db))
	api.GET("/dates", controller.GetDatesWithMenuItems(db))

	log.Fatal(r.Run(":8080"))
}
