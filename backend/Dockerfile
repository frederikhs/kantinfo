# syntax=docker/dockerfile:1

FROM golang:alpine AS development
WORKDIR /src

# install development reload tool
RUN --mount=type=cache,id=backend-go-build,target=/root/.cache/go-build \
    --mount=type=cache,id=backend-go-mod,target=/go/pkg/mod \
    go install github.com/cespare/reflex@latest
COPY reflex.conf /usr/local/etc/

COPY go.mod go.sum ./
RUN --mount=type=cache,id=backend-go-mod,target=/go/pkg/mod \
    go mod download

CMD ["reflex", "-d", "none", "-c", "/usr/local/etc/reflex.conf"]

FROM development AS build
COPY . .
RUN --mount=type=cache,id=backend-go-mod,target=/go/pkg/mod \
    --mount=type=cache,id=backend-go-build,target=/root/.cache/go-build \
    CGO_ENABLED=0 go build -o /go/bin/http cmd/http/main.go

FROM alpine AS production
COPY --from=build /go/bin/http /go/bin/http
ENTRYPOINT ["/go/bin/http"]
