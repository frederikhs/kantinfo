package controller

import (
	"kantinfo/internal/persistence"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetDatesWithMenuItems(persistor persistence.SqlitePersistor) func(c *gin.Context) {
	return func(c *gin.Context) {
		dates, err := persistor.GetDates()
		if err != nil {
			log.Println(err)
			BackendFetchError(c)
			return
		}

		c.JSON(http.StatusOK, dates)
	}
}

func GetMenuItemsForDate(c *gin.Context, persistor persistence.SqlitePersistor, date string) {
	items, err := persistor.GetMenuItemsForDate(date)
	if err != nil {
		log.Println(err)
		BackendFetchError(c)
		return
	}

	if items == nil || len(*items) == 0 {
		ResourceNotFound(c)
		return
	}

	surrounding, err := persistor.GetSurroundingDates(date)
	if err != nil {
		log.Println(err)
		BackendFetchError(c)
		return
	}

	currentOrNext, err := persistor.GetCurrentOrNext()
	if err != nil {
		log.Println(err)
		BackendFetchError(c)
		return
	}

	c.JSON(http.StatusOK, MenuForDateResponse{
		MenuItems:     items,
		Navigation:    surrounding,
		CurrentorNext: currentOrNext,
	})
}

type MenuForDateResponse struct {
	MenuItems     *[]persistence.MenuItem        `json:"menu"`
	Navigation    *persistence.SurroundingDates  `json:"navigation"`
	CurrentorNext *persistence.CurrentOrNextDate `json:"current_or_next"`
}

func GetMenuItemsForDateByRouteParam(persistor persistence.SqlitePersistor) func(c *gin.Context) {
	return func(c *gin.Context) {
		dateParam := c.Param("date")
		_, err := time.Parse(time.DateOnly, dateParam)
		if err != nil {
			log.Println(err)
			UserError(c, ErrNotADate)
			return
		}

		GetMenuItemsForDate(c, persistor, dateParam)
	}
}

func GetMenuItemsNext(persistor persistence.SqlitePersistor) func(c *gin.Context) {
	return func(c *gin.Context) {
		currentOrNext, err := persistor.GetCurrentOrNext()
		if err != nil {
			log.Println(err)
			BackendFetchError(c)
			return
		}

		if currentOrNext.Date == nil {
			ResourceNotFound(c)
			return
		}

		GetMenuItemsForDate(c, persistor, *currentOrNext.Date)
	}
}
