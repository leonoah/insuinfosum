import { PensionProduct, PensionSummary, PensionFileData } from "@/types/pension";
import { SelectedProduct } from "@/types/products";

export class PensionParser {
  static samplePensionData: PensionFileData = {
    fileName: "מסלקה_2024.pdf",
    parsedDate: "2024-04-30",
    summary: {
      clientId: "11132925",
      clientName: "לאון נח",
      reportDate: "30/04/2024",
      totalByType: {
        'קרנות השתלמות': 527303,
        'קופות גמל': 79024,
        'חברות ביטוח': 505084,
        'קרנות פנסיה חדשות': 1043736
      },
      products: [
        // חברות ביטוח - מגדל
        {
          id: "mig-15547294",
          company: "מגדל",
          productType: "חברת ביטוח",
          policyNumber: "15547294",
          status: "פעיל",
          currentBalance: 392129,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 1.25,
          annualReturn: 2.98,
          lastDeposit: {
            employee: 2587,
            employer: 5850.60
          },
          projectedBalanceAtRetirement: 671744,
          projectedMonthlyPension: 3330.42,
          insuranceCoverage: {
            deathBenefit: 392128,
            disabilityBenefit: 0
          },
          planOpenDate: "01/04/2008"
        },
        // קרנות השתלמות - לאומי מקפת
        {
          id: "leu-44126422", 
          company: "לאומי-מקפת",
          productType: "קרן השתלמות",
          policyNumber: "44126422",
          status: "לא פעיל",
          currentBalance: 127960.27,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0.7,
          annualReturn: 2.83,
          eligibleForWithdrawal: "ניתן למשיכה",
          projectedBalanceAtRetirement: 127960.27,
          planOpenDate: "14/08/2022"
        },
        // קרנות השתלמות - מגדל
        {
          id: "mig-44126403",
          company: "מגדל", 
          productType: "קרן השתלמות",
          policyNumber: "44126403",
          status: "לא פעיל",
          currentBalance: 60173.75,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0.7,
          annualReturn: 2.72,
          eligibleForWithdrawal: "ניתן למשיכה",
          projectedBalanceAtRetirement: 60173.75,
          planOpenDate: "14/08/2022"
        },
        // קרנות השתלמות - שחם
        {
          id: "sha-6540019",
          company: "שחם",
          productType: "קרן השתלמות", 
          policyNumber: "6540019",
          status: "לא פעיל",
          currentBalance: 182934.06,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0.75,
          annualReturn: 3.28,
          eligibleForWithdrawal: "ניתן למשיכה",
          projectedBalanceAtRetirement: 182934.06,
          planOpenDate: "20/05/2015"
        },
        // קרנות השתלמות - לפידות
        {
          id: "lap-72365915",
          company: "לפידות",
          productType: "קרן השתלמות",
          policyNumber: "72365915", 
          status: "פעיל",
          currentBalance: 59341.53,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0.75,
          annualReturn: 2.44,
          lastDeposit: {
            employee: 393,
            employer: 1178,
            date: "04/2024"
          },
          eligibleForWithdrawal: "ניתן למשיכה",
          projectedBalanceAtRetirement: 59341.53,
          planOpenDate: "01/11/2023"
        },
        // קופות גמל - לאומי מקפת
        {
          id: "leu-gml-44146078",
          company: "לאומי-מקפת",
          productType: "קופת גמל",
          policyNumber: "44146078",
          status: "פעיל",
          currentBalance: 27687.04,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0.7,
          annualReturn: 9.51,
          eligibleForWithdrawal: "13/11/2036",
          projectedBalanceAtRetirement: 49879
        },
        // קופות גמל - מגדל
        {
          id: "mig-gml-44126410",
          company: "מגדל",
          productType: "קופת גמל",
          policyNumber: "44126410",
          status: "לא פעיל",
          currentBalance: 51111.89,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0.7,
          annualReturn: 10.55,
          eligibleForWithdrawal: "13/11/2036",
          projectedBalanceAtRetirement: 92052.77
        },
        // ביטוח משכנתא - מנורה מבטחים
        {
          id: "men-500967526",
          company: "מנורה מבטחים",
          productType: "ביטוח משכנתא",
          policyNumber: "500967526",
          status: "פעיל",
          currentBalance: 0,
          managementFeeFromDeposit: 0,
          managementFeeFromBalance: 0,
          annualReturn: 0,
          projectedBalanceAtRetirement: 0,
          insuranceCoverage: {
            deathBenefit: 121169,
            disabilityBenefit: 0
          },
          notes: "ביטוח חיים משכנתא עד 31/12/2031"
        }
      ]
    }
  };

  static convertPensionProductToInsuranceProduct(pensionProduct: PensionProduct): SelectedProduct {
    // מיפוי סוג מוצר לקטגוריה ב-DB
    const categoryMapping: Record<string, string> = {
      'קרן השתלמות': 'קרן השתלמות',
      'קופת גמל': 'קופת גמל',
      'חברת ביטוח': 'ביטוח מנהלים',
      'קרן פנסיה חדשה': 'קרן פנסיה',
      'ביטוח משכנתא': 'ביטוח חיים'
    };
    
    const initialCategory = categoryMapping[pensionProduct.productType] || pensionProduct.productType;
    const initialCompany = this.normalizeCompanyName(pensionProduct.company);
    
    console.log('🔍 Pension Product Initial Mapping:');
    console.log(`   Input: Type="${pensionProduct.productType}", Company="${pensionProduct.company}"`);
    console.log(`   Initial: Category="${initialCategory}", Company="${initialCompany}"`);
    console.log(`   Note: Smart matching will be applied by caller`);
    
    return {
      id: pensionProduct.id,
      category: initialCategory,
      subCategory: 'מסלול כללי', // ברירת מחדל - will be matched by caller
      company: initialCompany,
      type: 'current',
      status: pensionProduct.status, // שמירת הסטטוס
      amount: pensionProduct.currentBalance,
      managementFeeOnDeposit: pensionProduct.managementFeeFromDeposit,
      managementFeeOnAccumulation: pensionProduct.managementFeeFromBalance,
      riskLevelChange: 'no-change',
      notes: this.generateProductNotes(pensionProduct),
      investmentTrack: pensionProduct.status === 'פעיל' ? 'כללי' : 'לא פעיל'
    };
  }

  private static normalizeCompanyName(company: string): string {
    // ניקוי והתאמת שמות חברות
    const normalized = company
      .replace(/בע"מ/g, '')
      .replace(/ניהול קופות גמל/g, '')
      .replace(/קרן השתלמות/g, '')
      .replace(/-/g, ' ')
      .trim();
    
    // מיפוי שמות ידועים
    const companyMapping: Record<string, string> = {
      'לאומי מקפת': 'מגדל',
      'לאומי': 'מגדל',
      'שחם': 'מגדל',
      'לפידות': 'מגדל',
      'מנורה': 'מנורה מבטחים',
      'כלל': 'כלל',
      'הפניקס': 'הפניקס',
      'איילון': 'איילון',
      'הראל': 'הראל',
      'אלטשולר שחם': 'אלטשולר שחם',
      'אלטשולר': 'אלטשולר שחם'
    };
    
    // חיפוש התאמה
    for (const [key, value] of Object.entries(companyMapping)) {
      if (normalized.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // אם לא נמצאה התאמה, מחזירים את השם המנוקה או ברירת מחדל
    return normalized || 'מגדל';
  }

  private static getProductDisplayName(productType: string, company: string): string {
    const typeMap = {
      'קרן השתלמות': `קרן השתלמות ${company}`,
      'קופת גמל': `קופת גמל ${company}`,
      'חברת ביטוח': `פוליסת חיסכון ${company}`,
      'קרן פנסיה חדשה': `קרן פנסיה ${company}`,
      'ביטוח משכנתא': `ביטוח משכנתא ${company}`
    };
    return typeMap[productType as keyof typeof typeMap] || `${productType} ${company}`;
  }

  private static generateProductNotes(product: PensionProduct): string {
    const notes: string[] = [];
    
    if (product.status === 'לא פעיל') {
      notes.push('חשבון לא פעיל');
    }
    
    if (product.eligibleForWithdrawal === 'ניתן למשיכה' || product.eligibleForWithdrawal === true) {
      notes.push('ניתן למשיכה');
    } else if (typeof product.eligibleForWithdrawal === 'string' && product.eligibleForWithdrawal !== 'ניתן למשיכה') {
      notes.push(`זכאות למשיכה: ${product.eligibleForWithdrawal}`);
    }

    if (product.annualReturn > 0) {
      notes.push(`תשואה שנתית: ${product.annualReturn}%`);
    }

    if (product.lastDeposit && product.lastDeposit.date) {
      notes.push(`הפקדה אחרונה: ${product.lastDeposit.date}`);
    }

    if (product.insuranceCoverage && product.insuranceCoverage.deathBenefit > 0) {
      notes.push(`כיסוי מוות: ₪${product.insuranceCoverage.deathBenefit.toLocaleString()}`);
    }

    if (product.projectedMonthlyPension && product.projectedMonthlyPension > 0) {
      notes.push(`קצבה צפויה: ₪${product.projectedMonthlyPension.toLocaleString()}`);
    }

    if (product.notes) {
      notes.push(product.notes);
    }

    return notes.join(' | ');
  }

  static async parsePensionFile(file: File): Promise<PensionFileData | null> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // טיפול בקובץ ZIP
    if (fileExtension === 'zip') {
      const { XMLPensionParser } = await import('./xmlPensionParser');
      const zipData = await XMLPensionParser.parseZIPFile(file);
      
      const totalByType = this.getTotalByType(zipData.products);
      
      return {
        fileName: file.name,
        parsedDate: new Date().toLocaleDateString('he-IL'),
        summary: {
          clientId: zipData.clientId,
          clientName: zipData.clientName,
          clientPhone: zipData.clientPhone,
          clientEmail: zipData.clientEmail,
          reportDate: zipData.reportDate,
          products: zipData.products,
          totalByType: {
            'קרנות השתלמות': totalByType['קרן השתלמות'] || 0,
            'קופות גמל': totalByType['קופת גמל'] || 0,
            'חברות ביטוח': totalByType['חברת ביטוח'] || 0,
            'קרנות פנסיה חדשות': totalByType['קרן פנסיה חדשה'] || 0
          }
        }
      };
    }
    
    // טיפול בקובץ XML
    if (fileExtension === 'xml') {
      const { XMLPensionParser } = await import('./xmlPensionParser');
      const xmlData = await XMLPensionParser.parseXMLFile(file);
      
      const totalByType = this.getTotalByType(xmlData.products);
      
      return {
        fileName: file.name,
        parsedDate: new Date().toLocaleDateString('he-IL'),
        summary: {
          clientId: xmlData.clientId,
          clientName: xmlData.clientName,
          clientPhone: xmlData.clientPhone,
          clientEmail: xmlData.clientEmail,
          reportDate: xmlData.reportDate,
          products: xmlData.products,
          totalByType: {
            'קרנות השתלמות': totalByType['קרן השתלמות'] || 0,
            'קופות גמל': totalByType['קופת גמל'] || 0,
            'חברות ביטוח': totalByType['חברת ביטוח'] || 0,
            'קרנות פנסיה חדשות': totalByType['קרן פנסיה חדשה'] || 0
          }
        }
      };
    }
    
    // טיפול בקובץ PDF
    if (fileExtension === 'pdf') {
      // בעתיד ניתן לשלב עם AI לפיענוח אוטומטי של קבצי PDF
      if (!file.name.toLowerCase().includes('מסלקה') && !file.name.toLowerCase().includes('pension')) {
        throw new Error('קובץ זה לא נראה כמו מסלקה פנסיונית');
      }
      
      // החזרת נתונים לדוגמה
      return this.samplePensionData;
    }
    
    throw new Error('נתמך רק קבצי PDF, XML או ZIP');
  }

  static getProductsByType(products: PensionProduct[], type: string): PensionProduct[] {
    return products.filter(product => product.productType === type);
  }

  static getTotalByType(products: PensionProduct[]): Record<string, number> {
    const totals: Record<string, number> = {};
    
    products.forEach(product => {
      if (!totals[product.productType]) {
        totals[product.productType] = 0;
      }
      totals[product.productType] += product.currentBalance;
    });
    
    return totals;
  }
}