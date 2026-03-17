// =================================================================
// BUNDLE.JS — Toàn bộ ứng dụng gộp lại theo thứ tự đúng
// =================================================================

const { useState, useCallback, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────────────
// UTILS — Hàm hỗ trợ & localStorage
// ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return "0";
  return Number(n).toLocaleString("vi-VN");
}

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const LS_CLASS = "diemdanh_classes_v2";
const LS_PAID_PREFIX  = "hocphi_paid_v3_";

