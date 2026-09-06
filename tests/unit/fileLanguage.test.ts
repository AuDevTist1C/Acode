import {
	getFileLanguageExtension,
	preloadFileLanguage,
	waitForFileLanguage,
} from "cm/fileLanguage";
import { describe, expect, it, vi } from "vitest";

describe("restored file language preparation", () => {
	it("loads in parallel with file I/O and supplies a synchronous extension for the first populated state", async () => {
		let resolve!: (value: []) => void;
		const extension: [] = [];
		const provider = vi.fn(
			() =>
				new Promise<[]>((done) => {
					resolve = done;
				}),
		);
		const file = { currentLanguageExtension: provider };
		const preload = preloadFileLanguage(file);
		let published = false;
		const ready = waitForFileLanguage(file).then(() => {
			published = true;
		});
		await Promise.resolve();
		expect(provider).toHaveBeenCalledTimes(1);
		expect(published).toBe(false);
		resolve(extension);
		await Promise.all([preload, ready]);
		expect(getFileLanguageExtension(file)).toBe(extension);
		expect(provider).toHaveBeenCalledTimes(1);
	});
	it("does not reuse an old preparation after a mode change", async () => {
		const oldExtension: [] = [],
			nextExtension: [] = [];
		const file = { currentLanguageExtension: () => oldExtension };
		await preloadFileLanguage(file);
		file.currentLanguageExtension = () => nextExtension;
		expect(getFileLanguageExtension(file)).toBe(nextExtension);
	});
	it("does not cache startup extensions across later settings changes", async () => {
		const extension: [] = [];
		const provider = vi.fn(() => extension);
		const file = { currentLanguageExtension: provider };
		await preloadFileLanguage(file);
		getFileLanguageExtension(file);
		getFileLanguageExtension(file);
		expect(provider).toHaveBeenCalledTimes(2);
	});
	it("lets restored text open if language loading fails", async () => {
		const file = {
			currentLanguageExtension: () =>
				Promise.reject(new Error("missing chunk")),
		};
		const preload = preloadFileLanguage(file);
		const ready = waitForFileLanguage(file);
		await expect(preload).rejects.toThrow("missing chunk");
		await expect(ready).resolves.toBeUndefined();
	});
});
