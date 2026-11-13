import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  acquireScrollLock,
  releaseScrollLock,
  getActiveScrollLockCount,
  getSavedScrollPosition,
  resetScrollLock,
} from "@/lib/scrollLock";

describe("Global Modal Scroll Lock & Viewport Manager", () => {
  let mockBody: any;
  let mockHtml: any;
  let scrollToMock: any;

  beforeEach(() => {
    // Reset global state
    resetScrollLock();

    scrollToMock = vi.fn();

    mockBody = {
      style: {
        position: "",
        top: "",
        left: "",
        width: "",
        overflow: "",
        paddingRight: "",
      },
    };

    const attributes: Record<string, string> = {};
    mockHtml = {
      style: {
        overflow: "",
      },
      clientWidth: 1200,
      setAttribute: vi.fn((key: string, val: string) => {
        attributes[key] = val;
      }),
      removeAttribute: vi.fn((key: string) => {
        delete attributes[key];
      }),
      getAttribute: vi.fn((key: string) => attributes[key]),
      scrollTop: 0,
      scrollLeft: 0,
    };

    // Setup global window and document
    (global as any).window = {
      scrollY: 450,
      scrollX: 0,
      pageYOffset: 450,
      pageXOffset: 0,
      innerWidth: 1215, // 15px scrollbar width
      scrollTo: scrollToMock,
    };

    (global as any).document = {
      body: mockBody,
      documentElement: mockHtml,
    };
  });

  afterEach(() => {
    resetScrollLock();
    delete (global as any).window;
    delete (global as any).document;
  });

  it("starts with zero active locks and clear position", () => {
    expect(getActiveScrollLockCount()).toBe(0);
    const pos = getSavedScrollPosition();
    expect(pos.y).toBe(0);
  });

  it("locks background scroll on first modal open and compensates for scrollbar width", () => {
    acquireScrollLock();

    expect(getActiveScrollLockCount()).toBe(1);
    expect(mockHtml.setAttribute).toHaveBeenCalledWith("data-sr-scroll-locked", "true");
    expect(mockHtml.style.overflow).toBe("hidden");

    expect(mockBody.style.position).toBe("fixed");
    expect(mockBody.style.top).toBe("-450px");
    expect(mockBody.style.width).toBe("100%");
    expect(mockBody.style.overflow).toBe("hidden");
    // 1215 - 1200 = 15px scrollbar compensation
    expect(mockBody.style.paddingRight).toBe("15px");

    const pos = getSavedScrollPosition();
    expect(pos.y).toBe(450);
  });

  it("handles nested modals via reference counting without losing original scroll position", () => {
    acquireScrollLock(); // First modal (e.g., SettleUpModal)
    expect(getActiveScrollLockCount()).toBe(1);

    // Simulate window position change while modal is open (should not affect saved pos)
    (global as any).window.scrollY = 0;

    acquireScrollLock(); // Nested modal (e.g., QR Code or Confirmation)
    expect(getActiveScrollLockCount()).toBe(2);
    // Saved position remains the initial 450px
    expect(getSavedScrollPosition().y).toBe(450);

    // Close nested modal
    releaseScrollLock();
    expect(getActiveScrollLockCount()).toBe(1);
    // Still locked!
    expect(mockBody.style.position).toBe("fixed");
    expect(mockHtml.style.overflow).toBe("hidden");
    expect(scrollToMock).not.toHaveBeenCalled();

    // Close primary modal
    releaseScrollLock();
    expect(getActiveScrollLockCount()).toBe(0);

    // Unlocked and restored to original position
    expect(mockBody.style.position).toBe("");
    expect(mockBody.style.top).toBe("");
    expect(mockBody.style.paddingRight).toBe("");
    expect(mockHtml.removeAttribute).toHaveBeenCalledWith("data-sr-scroll-locked");
    expect(scrollToMock).toHaveBeenCalledWith(
      expect.objectContaining({ top: 450, left: 0 })
    );
  });

  it("safely handles extra releases without negative count or error", () => {
    acquireScrollLock();
    releaseScrollLock();
    expect(getActiveScrollLockCount()).toBe(0);

    // Extra release
    expect(() => releaseScrollLock()).not.toThrow();
    expect(getActiveScrollLockCount()).toBe(0);
  });

  it("resets cleanly on emergency or test teardown", () => {
    acquireScrollLock();
    acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(2);

    resetScrollLock();
    expect(getActiveScrollLockCount()).toBe(0);
    expect(mockHtml.removeAttribute).toHaveBeenCalledWith("data-sr-scroll-locked");
    expect(mockBody.style.position).toBe("");
  });
});

