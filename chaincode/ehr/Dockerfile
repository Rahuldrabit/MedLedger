FROM golang:1.20-alpine AS builder
WORKDIR /chaincode
COPY . .
RUN go mod vendor && CGO_ENABLED=0 GOOS=linux go build -mod=vendor -o chaincode .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /chaincode/chaincode .
CMD ["./chaincode"]
