package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupCors(allowOrigin string) gin.HandlerFunc {
	config := cors.DefaultConfig()
	config.AllowMethods = []string{"GET"}
	config.AllowOrigins = []string{allowOrigin}
	config.AllowCredentials = true

	return cors.New(config)
}
