# מבנה נתונים של מוצר - InMinds

## תיאור כללי
מסמך זה מתאר את מבנה הנתונים של מוצר פיננסי במערכת InMinds. המבנה משמש לסוכן AI לצורך עריכה ועדכון מוצרים.

## שדות חובה

| שדה | סוג | תיאור | דוגמה |
|-----|-----|-------|--------|
| `id` | string | מזהה ייחודי של המוצר | "1234567890" |
| `category` | string | סוג המוצר הפיננסי | "קרן פנסיה" |
| `subCategory` | string | תת-קטגוריה או מסלול השקעה | "כללי" |
| `company` | string | שם החברה או הגוף המנהל | "הראל" |
| `amount` | number | סכום הצבירה בשקלים | 500000 |
| `managementFeeOnDeposit` | number | דמי ניהול מהפקדה (%) | 0.5 |
| `managementFeeOnAccumulation` | number | דמי ניהול מצבירה (%) | 0.3 |
| `investmentTrack` | string | מסלול השקעה | "כללי" |
| `notes` | string | הערות נוספות | "מוצר מומלץ" |
| `type` | "current" \| "recommended" | סוג המוצר | "recommended" |

## שדות אופציונליים

### מידע כללי
| שדה | סוג | תיאור | דוגמה |
|-----|-----|-------|--------|
| `riskLevelChange` | string | שינוי ברמת הסיכון | "no-change" |
| `status` | string | סטטוס המוצר | "פעיל" |
| `productNumber` | string | מספר מוצר | "1234567" |
| `returns` | number | תשואה (%) | 5.5 |
| `includeExposureData` | boolean | האם לכלול נתוני חשיפה | true |

### נתוני חשיפה (Exposure Data)
| שדה | סוג | תיאור | טווח |
|-----|-----|-------|------|
| `exposureStocks` | number | חשיפה מנייתית (%) | 0-100 |
| `exposureBonds` | number | חשיפה לאג"ח (%) | 0-100 |
| `exposureForeignCurrency` | number | חשיפה למט"ח (%) | 0-100 |
| `exposureForeignInvestments` | number | חשיפה לחו"ל (%) | 0-100 |
| `exposureIsrael` | number | חשיפה לישראל (%) | 0-100 |
| `exposureIlliquidAssets` | number | נכסים לא סחירים (%) | 0-100 |
| `assetComposition` | string | הרכב נכסים מפורט | "מניות 30%..." |

### שליטה על הצגת נתוני חשיפה
| שדה | סוג | ברירת מחדל |
|-----|-----|------------|
| `includeStocksInSummary` | boolean | true |
| `includeBondsInSummary` | boolean | true |
| `includeForeignCurrencyInSummary` | boolean | true |
| `includeForeignInvestmentsInSummary` | boolean | true |

## ערכים אפשריים (Enums)

### קטגוריות מוצר (category)
- "קרן פנסיה"
- "קרן השתלמות"
- "קופת גמל"
- "ביטוח מנהלים"

### מסלולי השקעה (investmentTrack)
- "כללי"
- "מניות"
- "אג"ח"
- "סולידי"
- "מניות חו"ל"
- "הלכתי/שרעי"
- "סקטוריאלי/אלטרנטיבי"

### שינוי רמת סיכון (riskLevelChange)
- "ירידה"
- "העלאה"
- "פיזור מחדש"
- "no-change"
- "" (ריק)

### סטטוס (status)
- "פעיל"
- "לא פעיל"

## דוגמה מלאה

```json
{
  "id": "1234567890",
  "category": "קרן פנסיה",
  "subCategory": "כללי",
  "company": "הראל",
  "amount": 500000,
  "managementFeeOnDeposit": 0.5,
  "managementFeeOnAccumulation": 0.3,
  "investmentTrack": "כללי",
  "riskLevelChange": "no-change",
  "notes": "מוצר מומלץ ללקוח עם פרופיל סיכון בינוני",
  "type": "recommended",
  "status": "פעיל",
  "productNumber": "1234567",
  "includeExposureData": true,
  "returns": 5.5,
  "exposureStocks": 30,
  "exposureBonds": 50,
  "exposureForeignCurrency": 20,
  "exposureForeignInvestments": 15,
  "exposureIsrael": 85,
  "exposureIlliquidAssets": 5,
  "assetComposition": "מניות 30%, אג\"ח 50%, מזומנים 20%",
  "includeStocksInSummary": true,
  "includeBondsInSummary": true,
  "includeForeignCurrencyInSummary": true,
  "includeForeignInvestmentsInSummary": true
}
```

## הנחיות לסוכן AI

### פעולות נפוצות

1. **שינוי חברה**:
   ```
   "תשנה לי למגדל"
   → עדכן: company = "מגדל"
   ```

2. **שינוי דמי ניהול**:
   ```
   "תשנה דמי ניהול ל-0.3"
   → עדכן: managementFeeOnAccumulation = 0.3
   ```

3. **שינוי סכום**:
   ```
   "תעדכן צבירה ל-500000"
   → עדכן: amount = 500000
   ```

4. **שינוי מסלול**:
   ```
   "תשנה למסלול מניות"
   → עדכן: investmentTrack = "מניות", subCategory = "מניות"
   ```

### כללי עדכון

- ✅ תמיד שמור על שדות חובה
- ✅ ודא שערכי אחוזים בין 0-100
- ✅ ודא שסכומים חיוביים
- ✅ השתמש רק בערכים מהרשימה המוגדרת (enum)
- ⚠️ אל תשנה את ה-id אלא אם כן מבוקש במפורש
- ⚠️ אל תשנה את ה-type אלא אם כן מבוקש במפורש

### טיפול בשגיאות

- אם לא ברור איזה שדה לעדכן - בקש הבהרה
- אם הערך לא תקין (למשל אחוזים >100) - החזר שגיאה
- אם הקטגוריה/חברה לא קיימות במאגר - הצע חלופות קרובות
