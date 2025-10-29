# GWDM
A GUI software about WDM systems. Thanks wails!

# Build

## Install wails3 
```shell
git clone https://github.com/wailsapp/wails.git
cd wails
git checkout v3-alpha
cd v3/cmd/wails3
go install

# Add $GOPATH to the environment variable
```
## Install go
```shell
https://go.dev/dl/
```
## Install nodejs
```shell
https://nodejs.org/en/download
```

## Build GWDM
```shell
# clone
git clone https://github.com/mostend/GWDM.git

#MacOS
wails3 package

#Windows
$env:PRODUCTION = "true"
wails3 task build

#Binary files in GWDM/bin
```
## Download

```shell
# Windows must have EDGE browser installed
https://github.com/mostend/GWDM/releases
```


## Link budget and ONSR

<img width="2798" height="1654" alt="image" src="https://github.com/user-attachments/assets/1f231867-18c6-4e88-abfb-9bc39a8a6fd7" />

<img width="2798" height="1654" alt="image" src="https://github.com/user-attachments/assets/db4e59fa-ca77-46ad-acad-54e152ea8ec9" />

