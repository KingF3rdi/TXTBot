import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMillions, formatMoney, parseDuration, parsePrice, payCommand, stars, formatUserText } from "./util.js";

test("formatiert Preise deutsch", () => {
  assert.equal(formatMoney(6_000_000), "$6.000.000");
  assert.equal(formatMoney(12300), "$12.300");
});

test("baut den /pay-Befehl mit Gesamtbetrag", () => {
  const qty = 3;
  const unit = 6_000_000;
  assert.equal(payCommand("TXTClan", unit * qty), "/pay TXTClan 18000000");
  assert.equal(payCommand("@Hugo", 500), "/pay Hugo 500");
  assert.equal(payCommand("", 2_500_000), "/pay y3zz 2500000");
  assert.equal(payCommand("y3zz", 1_000_000), "/pay y3zz 1000000");
});

test("parst Dauerangaben", () => {
  assert.equal(parseDuration("7h"), 7 * 3_600_000);
  assert.equal(parseDuration("30m"), 30 * 60_000);
  assert.equal(parseDuration("1d"), 86_400_000);
});

test("Sterne 1–5", () => {
  assert.equal(stars(5), "⭐⭐⭐⭐⭐  5/5");
  assert.equal(stars(3), "⭐⭐⭐☆☆  3/5");
});

test("Spawner-Preise in Millionen", () => {
  assert.equal(formatMillions(4_000_000), "4,0M");
  assert.equal(formatMillions(13_100_000), "13,1M");
  assert.equal(formatMillions(null), "STOP");
  assert.equal(parsePrice("4,0M"), 4_000_000);
  assert.equal(parsePrice("STOP"), null);
  assert.equal(parsePrice("13100000"), 13_100_000);
});

test("wandelt \\n in Slash-Text in echte Zeilenumbrüche um", () => {
  assert.equal(formatUserText("Hallo\\nWelt"), "Hallo\nWelt");
  assert.equal(formatUserText("**fett** *kursiv*"), "**fett** *kursiv*");
  assert.equal(formatUserText("a\\t b"), "a\t b");
});
