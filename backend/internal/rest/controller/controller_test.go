package controller

import (
	"kantinfo/internal/persistence"
	"reflect"
	"testing"
)

func TestGroupMenuItems(t *testing.T) {
	items := []persistence.MenuItem{
		{Group: "Dagens ret", Item: "Kylling"},
		{Group: "Green corner", Item: "Salat"},
		{Group: "Dagens ret", Item: "Ris"},
	}

	got := groupMenuItems(items)
	want := []MenuGroup{
		{Group: "Dagens ret", Items: []string{"Kylling", "Ris"}},
		{Group: "Green corner", Items: []string{"Salat"}},
	}

	if !reflect.DeepEqual(got, want) {
		t.Errorf("groupMenuItems() = %#v, want %#v", got, want)
	}
}
