import { describe, expect, it } from "vitest";
import { shouldShowConversationBrowserNotification } from "./browser-notifications";

describe("conversation browser notification guard", () => {
  it("requires explicit opt-in and granted browser permission", () => {
    expect(
      shouldShowConversationBrowserNotification({
        enabled: false,
        permission: "granted",
        appFocused: false,
      }),
    ).toBe(false);
    expect(
      shouldShowConversationBrowserNotification({
        enabled: true,
        permission: "default",
        appFocused: false,
      }),
    ).toBe(false);
  });

  it("suppresses notifications while Marinara is focused", () => {
    expect(
      shouldShowConversationBrowserNotification({
        enabled: true,
        permission: "granted",
        appFocused: true,
      }),
    ).toBe(false);
  });

  it("allows a generic notification when opted in, granted, and unfocused", () => {
    expect(
      shouldShowConversationBrowserNotification({
        enabled: true,
        permission: "granted",
        appFocused: false,
      }),
    ).toBe(true);
  });
});
