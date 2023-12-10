# homelens E2E test

## Prepare

install dependencies

```
yarn
```

install browsers

```
yarn playwright install --with-deps
```

## Run E2E test

Start application

```
cd ../
docker compose up -d
docker compose exec client yarn
docker compose exec client yarn build
docker compose exec client yarn hosting &
```

Run test

```
cd e2e test
yarn playwright test
```

Show test report

```
yarn playwright show-report
```
