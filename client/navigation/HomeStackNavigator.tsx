import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "@/screens/HomeScreen";
import GPACalculatorScreen from "@/screens/GPACalculatorScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
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
          headerTitle: () => <HeaderTitle title="Transfer Pathway" />,
        }}
      />
      <Stack.Screen
        name="GPACalculator"
        component={GPACalculatorScreen}
        options={{
          title: "GPA Calculator",
        }}
      />
    </Stack.Navigator>
  );
}
