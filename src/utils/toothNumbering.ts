// Tıbbi diş numaralandırması: 4 bölge, her bölgede 8 diş
// Bölge 1 (Üst Sağ): 11-18
// Bölge 2 (Üst Sol): 21-28
// Bölge 3 (Alt Sol): 31-38
// Bölge 4 (Alt Sağ): 41-48

// Basit sistemden (1-32) tıbbi sisteme (11-48) dönüştür
export function toMedicalNumber(simpleNumber: number): number {
  if (simpleNumber >= 1 && simpleNumber <= 8) {
    // Üst Sağ (Bölge 1): 11-18
    return 10 + simpleNumber
  } else if (simpleNumber >= 9 && simpleNumber <= 16) {
    // Üst Sol (Bölge 2): 21-28
    return 20 + (simpleNumber - 8)
  } else if (simpleNumber >= 17 && simpleNumber <= 24) {
    // Alt Sol (Bölge 3): 31-38
    return 30 + (simpleNumber - 16)
  } else if (simpleNumber >= 25 && simpleNumber <= 32) {
    // Alt Sağ (Bölge 4): 41-48
    return 40 + (simpleNumber - 24)
  }
  return simpleNumber
}

// Tıbbi sistemden (11-48) basit sisteme (1-32) dönüştür
export function fromMedicalNumber(medicalNumber: number): number {
  if (medicalNumber >= 11 && medicalNumber <= 18) {
    // Üst Sağ (Bölge 1)
    return medicalNumber - 10
  } else if (medicalNumber >= 21 && medicalNumber <= 28) {
    // Üst Sol (Bölge 2)
    return medicalNumber - 12
  } else if (medicalNumber >= 31 && medicalNumber <= 38) {
    // Alt Sol (Bölge 3)
    return medicalNumber - 14
  } else if (medicalNumber >= 41 && medicalNumber <= 48) {
    // Alt Sağ (Bölge 4)
    return medicalNumber - 16
  }
  return medicalNumber
}

// Diş numarasına göre bölge bilgisi
export function getToothRegion(simpleNumber: number): { region: number; position: number; name: string } {
  if (simpleNumber >= 1 && simpleNumber <= 8) {
    return { region: 1, position: simpleNumber, name: 'Üst Sağ' }
  } else if (simpleNumber >= 9 && simpleNumber <= 16) {
    return { region: 2, position: simpleNumber - 8, name: 'Üst Sol' }
  } else if (simpleNumber >= 17 && simpleNumber <= 24) {
    return { region: 3, position: simpleNumber - 16, name: 'Alt Sol' }
  } else if (simpleNumber >= 25 && simpleNumber <= 32) {
    return { region: 4, position: simpleNumber - 24, name: 'Alt Sağ' }
  }
  return { region: 0, position: 0, name: 'Bilinmiyor' }
}
