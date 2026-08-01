package persistence

import (
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
	_ "github.com/ncruces/go-sqlite3/driver"
)

type SqlitePersistor struct {
	db *sqlx.DB
}

func NewDB() SqlitePersistor {
	db, err := sqlx.Open("sqlite3", "./db.sqlite")
	if err != nil {
		panic(err)
	}

	err = db.Ping()
	if err != nil {
		panic(err)
	}

	return SqlitePersistor{db: db}
}

func getData[T any](p SqlitePersistor, query string, args ...interface{}) (*T, error) {
	var data T

	err := p.db.Get(&data, query, args...)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		panic(err)
	}

	return &data, nil
}

func selectData[T any](p SqlitePersistor, query string, args ...interface{}) (*T, error) {
	var data T

	err := p.db.Select(&data, query, args...)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		panic(err)
	}

	return &data, nil
}

func (p SqlitePersistor) CreateTables() {
	inboxSchema := `
	CREATE TABLE IF NOT EXISTS menu
(
    date       DATE    NOT NULL,
    menu_group VARCHAR NOT NULL,
    menu_item  VARCHAR NOT NULL,
    UNIQUE (date, menu_group, menu_item)
);
	`

	_, err := p.db.Exec(inboxSchema)
	if err != nil {
		panic(err)
	}
}

func (p SqlitePersistor) ClearData() {
	q := `
    DELETE from menu;
	`

	_, err := p.db.Exec(q)
	if err != nil {
		panic(err)
	}
}

func (p SqlitePersistor) StoreMenu(date, group, item string) {
	conv := `
		INSERT INTO menu (
			date,
			menu_group,
			menu_item
		)
		VALUES (?, ?, ?)
	`

	p.db.MustExec(conv, date, group, item)
}

type MenuItem struct {
	Date  string `db:"date" json:"-"`
	Group string `db:"menu_group" json:"group"`
	Item  string `db:"menu_item" json:"item"`
}

func (p SqlitePersistor) GetMenuItemsForDate(date string) (*[]MenuItem, error) {
	q := `
		SELECT * FROM menu WHERE date = ?;
	`
	return selectData[[]MenuItem](p, q, date)
}

type SurroundingDates struct {
	Previous *string `db:"previous_date" json:"previous_date"`
	Next     *string `db:"next_date" json:"next_date"`
	Current  *string `db:"cur_date" json:"current_date"`
}

func (p SqlitePersistor) GetSurroundingDates(date string) (*SurroundingDates, error) {
	q := `
		SELECT (SELECT MAX(date)
        FROM menu
        WHERE date(date) < date(?)) AS previous_date,
       (SELECT MIN(date)
        FROM menu
        WHERE date(date) > date(?)) AS next_date,
	   (SELECT CAST(date AS TEXT)
	    FROM menu
	    WHERE date(date) = date(?)) AS cur_date
	`
	return getData[SurroundingDates](p, q, date, date, date)
}

type Date struct {
	Date     string `db:"date" json:"date"`
	IsFuture bool   `db:"is_future" json:"is_future"`
	IsToday  bool   `db:"is_today" json:"is_today"`
}

func (p SqlitePersistor) GetDates() (*[]Date, error) {
	q := `
		SELECT DISTINCT cast(date as varchar)                 as date,
						date(date) > date('now', 'localtime') AS is_future,
						date(date) = date('now', 'localtime') AS is_today
		FROM menu
		ORDER BY date DESC LIMIT 14;
	`
	return selectData[[]Date](p, q)
}

type CurrentOrNextDate struct {
	Date     *string `db:"selected_date" json:"date"`
	IsFuture *bool   `db:"is_future" json:"is_future"`
}

func (p SqlitePersistor) GetCurrentOrNext() (*CurrentOrNextDate, error) {
	q := `
		WITH target AS (
			SELECT MIN(date(date)) AS selected_date
			FROM menu
			WHERE date(date) >= date('now', 'localtime')
		)
		SELECT
			selected_date,
			selected_date > date('now', 'localtime') AS is_future
		FROM target;
	`
	return getData[CurrentOrNextDate](p, q)
}
