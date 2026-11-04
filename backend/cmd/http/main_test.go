package main

import (
	"testing"
	"time"
)

func TestNextMenuSync(t *testing.T) {
	location, err := time.LoadLocation("Europe/Copenhagen")
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name string
		now  string
		want string
	}{
		{"overnight", "2026-11-04T00:00:00+01:00", "2026-11-04T04:00:00+01:00"},
		{"before morning window", "2026-11-04T08:59:59+01:00", "2026-11-04T09:00:00+01:00"},
		{"morning starts", "2026-11-04T09:00:00+01:00", "2026-11-04T09:10:00+01:00"},
		{"during morning", "2026-11-04T10:15:30+01:00", "2026-11-04T10:25:30+01:00"},
		{"before morning ends", "2026-11-04T10:59:59+01:00", "2026-11-04T11:00:00+01:00"},
		{"morning ends", "2026-11-04T11:00:00+01:00", "2026-11-04T15:00:00+01:00"},
		{"afternoon", "2026-11-04T15:30:00+01:00", "2026-11-04T19:30:00+01:00"},
		{"cross midnight", "2026-11-04T23:30:00+01:00", "2026-11-05T03:30:00+01:00"},
		{"month boundary", "2026-11-30T23:00:00+01:00", "2026-12-01T03:00:00+01:00"},
		{"year boundary", "2026-12-31T23:00:00+01:00", "2027-01-01T03:00:00+01:00"},
		{"UTC input in winter", "2026-11-04T08:00:00Z", "2026-11-04T09:10:00+01:00"},
		{"UTC input in summer", "2026-08-04T07:00:00Z", "2026-08-04T09:10:00+02:00"},
		{"spring DST elapsed interval", "2026-03-29T00:30:00+01:00", "2026-03-29T05:30:00+02:00"},
		{"spring DST morning boundary", "2026-03-29T05:30:00+02:00", "2026-03-29T09:00:00+02:00"},
		{"autumn DST elapsed interval", "2026-10-25T00:30:00+02:00", "2026-10-25T03:30:00+01:00"},
		{"autumn DST morning boundary", "2026-10-25T07:30:00+01:00", "2026-10-25T09:00:00+01:00"},
		{"weekend morning", "2026-11-07T09:00:00+01:00", "2026-11-07T09:10:00+01:00"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			now, err := time.Parse(time.RFC3339, tt.now)
			if err != nil {
				t.Fatal(err)
			}
			want, err := time.Parse(time.RFC3339, tt.want)
			if err != nil {
				t.Fatal(err)
			}
			got := nextMenuSync(now, location)
			if !got.Equal(want) {
				t.Errorf("nextMenuSync(%s) = %s, want %s", now, got, want)
			}
		})
	}
}
