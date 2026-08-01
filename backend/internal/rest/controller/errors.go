package controller

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Message(code int, message string) (int, any) {
	return code, gin.H{"message": message}
}

func Error(c *gin.Context, err error) {
	c.Header("Cache-Control", "no-store")
	c.Header("Expires", "0")
	c.JSON(Message(http.StatusInternalServerError, err.Error()))
}

func UserError(c *gin.Context, err error) {
	c.Header("Cache-Control", "no-store")
	c.Header("Expires", "0")
	c.JSON(Message(http.StatusBadRequest, err.Error()))
}

func ResourceNotFound(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.Header("Expires", "0")
	c.JSON(Message(http.StatusNotFound, "resource not found"))
}

func BackendFetchError(c *gin.Context) {
	Error(c, ErrCouldNotFetchDataFromBackendStorage)
}

var (
	ErrNotADate                            = errors.New("not a date")
	ErrCouldNotFetchDataFromBackendStorage = errors.New("could not fetch data from backend storage")
)
