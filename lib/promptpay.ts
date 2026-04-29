function formatEMV(id: string, value: string) {
  const length = String(value.length).padStart(2, "0");
  return `${id}${length}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatPromptPayId(promptPayId: string) {
  const digits = promptPayId.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("0")) {
    return {
      type: "01",
      value: `0066${digits.slice(1)}`,
    };
  }

  if (digits.length === 13) {
    return {
      type: "02",
      value: digits,
    };
  }

  return {
    type: "03",
    value: digits,
  };
}

export function generatePromptPayPayload(promptPayId: string, amount: number) {
  const promptPay = formatPromptPayId(promptPayId);

  const merchantAccountInfo =
    formatEMV("00", "A000000677010111") +
    formatEMV(promptPay.type, promptPay.value);

  const payloadWithoutCrc =
    formatEMV("00", "01") +
    formatEMV("01", "12") +
    formatEMV("29", merchantAccountInfo) +
    formatEMV("53", "764") +
    formatEMV("54", amount.toFixed(2)) +
    formatEMV("58", "TH") +
    "6304";

  const crc = crc16(payloadWithoutCrc);

  return payloadWithoutCrc + crc;
}