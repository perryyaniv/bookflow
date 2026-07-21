export function isValidIsraeliPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^(0[2-489]\d{7}|0[57]\d{8})$/.test(digits);
}
