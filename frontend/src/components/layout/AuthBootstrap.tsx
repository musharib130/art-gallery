"use client";

import { useEffect } from "react";

import { useAuth } from "@/stores/auth";

/** Checks the stored login token once when the app loads in the browser. */
export function AuthBootstrap() {
  useEffect(() => {
    void useAuth.getState().init();
  }, []);
  return null;
}
