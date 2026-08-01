package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func CacheUntil(nextRefreshAt func() time.Time) gin.HandlerFunc {
	return func(c *gin.Context) {
		nextRefresh := nextRefreshAt()
		if nextRefresh.IsZero() {
			c.Header("Cache-Control", "no-store")
			c.Next()
			return
		}

		maxAge := int(time.Until(nextRefresh).Seconds())
		if maxAge < 0 {
			maxAge = 0
		}

		c.Header("Cache-Control", fmt.Sprintf("public, max-age=%d, must-revalidate", maxAge))
		c.Header("Expires", nextRefresh.UTC().Format(http.TimeFormat))
		c.Next()
	}
}
