# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Required Plugins for Migration from Flutter (Dart) to React Native

This project uses the following key plugins/libraries:

- Navigation: [@react-navigation/native](https://reactnavigation.org/), [@react-navigation/bottom-tabs]
- HTTP Requests: [axios] (install if needed)
- State Management: [Redux] (install if needed), or use React Context API
- Form Handling: [Formik] (install if needed)
- Authentication/Storage: [@react-native-async-storage/async-storage], [jwt-decode] (install if needed)
- UI Components: [@expo/vector-icons], [react-native-safe-area-context], [react-native-screens], [react-native-gesture-handler], [expo-splash-screen], [expo-status-bar], [expo-font], [expo-router]

See `package.json` for currently installed dependencies. Install missing plugins with npm or yarn as needed.

## Migration Notes

- The folder structure mirrors the original Flutter project: screens, components, hooks, constants, etc.
- Navigation is handled with React Navigation and Expo Router.
- For HTTP/API calls, use axios or fetch.
- State management can be done with Redux or Context API.
- Platform-specific features from Flutter should be mapped to React Native equivalents (see [React Native Directory](https://reactnative.directory/)).
- Update this README as you migrate more features.
