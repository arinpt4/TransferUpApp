import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoadmapScreen from "@/screens/RoadmapScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RoadmapStackParamList = {
  Roadmap: undefined;
};

const Stack = createNativeStackNavigator<RoadmapStackParamList>();

export default function RoadmapStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Roadmap"
        component={RoadmapScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
