# homelens server

## Development

Using WebFramework [Echo](https://echo.labstack.com/)

Hot Reload [Air](https://github.com/cosmtrek/air)

## Host

Hosted on [fly.io](https://fly.io/)

## Testing

```
$ go test -v
```

## Deploy

Install flyctl

```
$ curl -L https://fly.io/install.sh | sh
$ export FLYCTL_INSTALL="/home/username/.fly"
$ export PATH="$FLYCTL_INSTALL/bin:$PATH"
```

Deploy

```
$ flyctl auth login
$ cd server/
$ flyctl deploy
```
