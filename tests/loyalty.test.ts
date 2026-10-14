import assert from "node:assert/strict";
import { test } from "node:test";
import {
  pointsForAmount,
  earnPerAmount,
  referralOwnerPoints,
  referralRefereePoints,
} from "../src/lib/loyalty";

test("pointsForAmount: 1 poin per Rp10.000 (dibulatkan ke bawah)", () => {
  assert.equal(pointsForAmount(0), 0);
  assert.equal(pointsForAmount(9_999), 0);
  assert.equal(pointsForAmount(10_000), 1);
  assert.equal(pointsForAmount(19_999), 1);
  assert.equal(pointsForAmount(25_000), 2);
  assert.equal(pointsForAmount(1_000_000), 100);
});

test("pointsForAmount: nilai tidak valid/negatif -> 0", () => {
  assert.equal(pointsForAmount(-1), 0);
  assert.equal(pointsForAmount(NaN), 0);
  assert.equal(pointsForAmount(Infinity), 0);
});

test("earnPerAmount: default 10.000 dan minimal 1", () => {
  const prev = process.env.LOYALTY_EARN_PER_AMOUNT;
  try {
    delete process.env.LOYALTY_EARN_PER_AMOUNT;
    assert.equal(earnPerAmount(), 10_000);

    process.env.LOYALTY_EARN_PER_AMOUNT = "0";
    assert.equal(earnPerAmount(), 1, "0 harus di-clamp ke minimal 1");

    process.env.LOYALTY_EARN_PER_AMOUNT = "5000";
    assert.equal(earnPerAmount(), 5_000);
    assert.equal(pointsForAmount(15_000), 3);
  } finally {
    if (prev === undefined) delete process.env.LOYALTY_EARN_PER_AMOUNT;
    else process.env.LOYALTY_EARN_PER_AMOUNT = prev;
  }
});

test("referralOwnerPoints/referralRefereePoints: default & override", () => {
  const prevO = process.env.LOYALTY_REFERRAL_OWNER;
  const prevR = process.env.LOYALTY_REFERRAL_REFEREE;
  try {
    delete process.env.LOYALTY_REFERRAL_OWNER;
    delete process.env.LOYALTY_REFERRAL_REFEREE;
    assert.equal(referralOwnerPoints(), 5_000);
    assert.equal(referralRefereePoints(), 2_500);

    process.env.LOYALTY_REFERRAL_OWNER = "7000";
    process.env.LOYALTY_REFERRAL_REFEREE = "1000";
    assert.equal(referralOwnerPoints(), 7_000);
    assert.equal(referralRefereePoints(), 1_000);
  } finally {
    if (prevO === undefined) delete process.env.LOYALTY_REFERRAL_OWNER;
    else process.env.LOYALTY_REFERRAL_OWNER = prevO;
    if (prevR === undefined) delete process.env.LOYALTY_REFERRAL_REFEREE;
    else process.env.LOYALTY_REFERRAL_REFEREE = prevR;
  }
});
