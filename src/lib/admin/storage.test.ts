import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePerfumeImage, uploadPerfumeImage } from "./storage";

function fakeStorage(behaviour: {
  uploadError?: { message: string };
  removeError?: { message: string };
}) {
  const upload = vi.fn(async () => ({
    data: behaviour.uploadError ? null : { path: "x" },
    error: behaviour.uploadError ?? null,
  }));
  const remove = vi.fn(async () => ({
    data: behaviour.removeError ? null : [{}],
    error: behaviour.removeError ?? null,
  }));
  const db = {
    storage: { from: () => ({ upload, remove }) },
  } as unknown as SupabaseClient;
  return { db, upload, remove };
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** A File whose leading bytes are a real PNG signature, padded to `bytes`. */
const png = (bytes: number) => {
  const buf = new Uint8Array(Math.max(bytes, 0));
  buf.set(PNG_MAGIC.slice(0, buf.length));
  return new File([buf], "flacon.png", { type: "image/png" });
};

describe("uploadPerfumeImage", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("rejects an empty file", async () => {
    const { db } = fakeStorage({});
    const result = await uploadPerfumeImage(db, "noir", png(0));
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/choose/i) });
  });

  it("rejects a disallowed type (no 3D models, no PDFs, etc.)", async () => {
    const { db, upload } = fakeStorage({});
    const model = new File([new Uint8Array(10)], "bottle.glb", {
      type: "model/gltf-binary",
    });
    const result = await uploadPerfumeImage(db, "noir", model);
    expect(result.ok).toBe(false);
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a file whose bytes are not a real image (spoofed type)", async () => {
    const { db, upload } = fakeStorage({});
    const spoof = new File(
      [new TextEncoder().encode("<script>alert(1)</script>")],
      "evil.png",
      { type: "image/png" },
    );
    const result = await uploadPerfumeImage(db, "noir", spoof);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not a jpeg|not a .*image/i);
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects a file over 5 MB", async () => {
    const { db } = fakeStorage({});
    const result = await uploadPerfumeImage(db, "noir", png(5 * 1024 * 1024 + 1));
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toMatch(/5 mb/i);
  });

  it("uploads a valid image and returns a namespaced object key", async () => {
    const { db, upload } = fakeStorage({});
    const result = await uploadPerfumeImage(db, "lumiere-noire", png(2048));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.path).toMatch(/^lumiere-noire\/[0-9a-f-]+\.png$/);
      expect(upload).toHaveBeenCalledOnce();
    }
  });

  it("returns a plain message (not the raw error) when storage fails", async () => {
    const { db } = fakeStorage({ uploadError: { message: "bucket exploded" } });
    const result = await uploadPerfumeImage(db, "noir", png(2048));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/bucket exploded/);
      expect(result.error).toMatch(/try again/i);
    }
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("deletePerfumeImage", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("treats a local /public path as already gone", async () => {
    const { db, remove } = fakeStorage({});
    const result = await deletePerfumeImage(db, "/images/noire-bottle.svg");
    expect(result.ok).toBe(true);
    expect(remove).not.toHaveBeenCalled();
  });

  it("removes a storage object", async () => {
    const { db, remove } = fakeStorage({});
    const result = await deletePerfumeImage(db, "noir/abc.png");
    expect(result.ok).toBe(true);
    expect(remove).toHaveBeenCalledWith(["noir/abc.png"]);
  });

  it("returns a plain message when the delete fails", async () => {
    const { db } = fakeStorage({ removeError: { message: "permission denied" } });
    const result = await deletePerfumeImage(db, "noir/abc.png");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toMatch(/permission denied/);
    expect(errorSpy).toHaveBeenCalled();
  });
});
