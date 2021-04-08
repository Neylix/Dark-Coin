# Dark-Coin

Dark-Coin is an Android application to manage payments via NFC wristbands during an event.

This application does not use real money, money exchanges must be done outside the application. Once the exchanges are done, the NFC wristbands can be fed with the desired amount.

## Installation

Install node packages

```bash
npm install
```

Add Android to Ionic project

```bash
ionic cap add android
```

Build project

```bash
ionic cap build android
```

### Update Icons and Splash

Install cordova-res

```bash
npm i -g cordova-res
```

Update only these files (they must be in this resolution)

```bash
| ressources
|__ icon.png (512x512)
|__ splash.png (1920x1920)
|__ android
   |__ icon-foreground.png (432x432)
   |__ icon-background.png (432x432)
```

Move files in android folders using cordova-res command

```bash
cordova-res android --skip-config --copy
```
