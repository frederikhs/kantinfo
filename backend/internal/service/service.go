package service

import (
	"kantinfo/internal/persistence"
	"log"
	"net/http"
	"os"

	"github.com/frederikhs/kokkeneskoekken"
)

func SyncData(db persistence.SqlitePersistor) {
	db.ClearData()

	schoolId := os.Getenv("SCHOOL_ID")
	offerId := os.Getenv("OFFER_ID")

	schedule, err := kokkeneskoekken.GetSchedule(http.DefaultClient, schoolId, offerId)
	if err != nil {
		log.Printf("could not fetch schedule: %v\n", err)
		return
	}

	log.Printf("got schedule with %d dates\n", len(schedule))

	for date := range schedule {
		log.Printf("adding menu items for %s\n", date)
		for menuGroup := range schedule[date] {
			for _, menuItem := range schedule[date][menuGroup] {
				db.StoreMenu(date, menuGroup, menuItem)
			}
		}
	}
}
