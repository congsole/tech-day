export function validateMenuInput(name: string, price: string) {
  const nameError = name.trim() ? null : '메뉴명을 입력해 주세요'
  const amount = Number(price.trim())
  const priceError = !price.trim() || !Number.isInteger(amount) || amount < 0
    ? '금액을 원 단위 정수로 입력해 주세요'
    : amount > 2_147_483_647
      ? '금액은 2,147,483,647원 이하로 입력해 주세요'
      : null
  return { nameError, priceError, amount }
}
