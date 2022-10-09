package main

import (
	"net/http"
  "net/http/httptest"
  "testing"

	"github.com/labstack/echo/v4"
  "github.com/stretchr/testify/assert"
)

func TestHealthCheck(t *testing.T) {
  // Setup
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/hc", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Assertions
	if assert.NoError(t, healthCheck(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "OK", rec.Body.String())
	}
}
