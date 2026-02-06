import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "@/screens/HomeScreen";
import GPACalculatorScreen from "@/screens/GPACalculatorScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type HomeStackParamList = {
  Home: undefined;
  GPACalculator: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GPACalculator"
        component={GPACalculatorScreen}
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "transparent" },
          headerTransparent: true,
          animation: "none",
        }}
      />
    </Stack.Navigator>
  );
}
