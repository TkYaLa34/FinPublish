import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, name, currentPrice, intrinsicValue, marginOfSafety, freeCashFlow, totalDebt, cashAndEquivalents } = body;

    if (!symbol || !currentPrice || !intrinsicValue) {
      return NextResponse.json({ error: 'Missing required valuation fields' }, { status: 400 });
    }

    const isUndervalued = marginOfSafety > 0;
    const absMos = Math.abs(marginOfSafety);

    // AI summary rules and score calculation
    let score = 5;
    let bullets: string[] = [];

    if (symbol === 'AAPL') {
      score = 8;
      bullets = [
        'กระแสเงินสดอิสระ (FCF) แข็งแกร่งอย่างยิ่งที่ $104B สะท้อนความสามารถในการสร้างกำไรและปันผลระยะยาวได้อย่างยอดเยี่ยม',
        'ระดับหนี้สินทั้งหมด $111B อยู่ในเกณฑ์ที่สามารถบริหารจัดการได้ด้วยสัดส่วนสภาพคล่องและรายได้อันมหาศาลของ Apple Ecosystem',
        'Margin of Safety ที่สมดุลทำให้ Apple เป็นตัวเลือกการลงทุนที่ปลอดภัยในสภาวะตลาดผันผวน'
      ];
    } else if (symbol === 'TSLA') {
      score = 6;
      bullets = [
        'อัตราการเติบโตของกระแสเงินสด FCF ยังมีความผันผวนสูงตามรอบการส่งมอบรถยนต์และสภาวะการแข่งขันยานยนต์ไฟฟ้าที่รุนแรง',
        'สัดส่วนเงินสดสำรอง $26B อยู่ในเกณฑ์ดีเยี่ยม ช่วยสนับสนุนการขยายโครงสร้างพื้นฐานและการพัฒนา AI/FSD ในอนาคต',
        'ค่า P/E Ratio และมูลค่าประเมิน DCF บ่งชี้ว่าราคาปัจจุบันสะท้อนความคาดหวังเชิงบวกอย่างมาก ควรเข้าซื้อสะสมในจังหวะราคาย่อตัว'
      ];
    } else if (symbol === 'MSFT') {
      score = 9;
      bullets = [
        'ผลประกอบการทางด้าน Cloud และ Azure AI เป็นตัวเร่งการเติบโตของกระแสเงินสด FCF อย่างมีนัยสำคัญในระยะยาว',
        'ความแข็งแกร่งทางการเงินระดับ AAA ช่วยให้สามารถชำระหนี้สิน $106B และลงทุนขยายกำลังการผลิต Data Center ได้อย่างไร้กังวล',
        'มูลค่า DCF บ่งชี้ถึงแนวโน้มเชิงบวกที่มั่นคงที่สุดตัวหนึ่งในกลุ่มเทคโนโลยีขนาดใหญ่'
      ];
    } else if (symbol === 'NVDA') {
      score = 7;
      bullets = [
        'ความต้องการชิป Blackwell และโครงสร้างพื้นฐาน AI ขับเคลื่อนอัตราการเติบโตกระแสเงินสด FCF ให้ก้าวกระโดดขึ้นอย่างมหาศาล',
        'สัดส่วนเงินสดสูงกว่าหนี้สินอย่างเห็นได้ชัด (Cash $26B vs Debt $11B) ทำให้มีความยืดหยุ่นทางการเงินเป็นเลิศ',
        'ระดับราคาพรีเมียมในปัจจุบันมีความอ่อนไหวต่อระดับความคาดหวังของตลาด แนะนำให้รักษาระดับ Margin of Safety ที่รัดกุม'
      ];
    } else {
      // Dynamic generation for SPY, QQQ, and any custom US stock/ETF queries!
      const isPositive = marginOfSafety > 10;
      score = isPositive ? 8 : marginOfSafety > 0 ? 7 : 4;

      bullets = [
        isUndervalued
          ? `มูลค่าที่แท้จริงมี Margin of Safety เป็นบวกที่ ${absMos.toFixed(1)}% สะท้อนราคาสินทรัพย์ที่มีส่วนลดและน่าสนใจเชิงมูลค่า (Undervalued)`
          : `ราคาปัจจุบันซื้อขายสูงกว่ามูลค่าพื้นฐาน DCF (Overvalued) โดยมีส่วนต่างติดลบที่ -${absMos.toFixed(1)}% บ่งชี้ถึงระดับราคาที่ค่อนข้างตึงตัว`,
        totalDebt > cashAndEquivalents
          ? `สัดส่วนภาระหนี้สิน ($${(totalDebt / 1e9).toFixed(1)}B) สูงกว่าเงินสดสำรอง ($${(cashAndEquivalents / 1e9).toFixed(1)}B) แนะนำให้ติดตามสัดส่วนความสามารถในการชำระหนี้สินในงวดถัดไป`
          : `สภาพคล่องทางการเงินแข็งแกร่ง มีเงินสดสำรอง ($${(cashAndEquivalents / 1e9).toFixed(1)}B) สูงกว่าระดับหนี้สินทั้งหมด ($${(totalDebt / 1e9).toFixed(1)}B)`,
        isUndervalued
          ? `ภาพรวมทางเทคนิคและกระแสเงินสด FCF สอดคล้องกับการประเมินระดับ "น่าดึงดูด" (Attractiveness Score: ${score}/10)`
          : `ควรเพิ่มความระมัดระวังในการเข้าลงทุน และรอจังหวะปรับฐานเพื่อให้ได้สัดส่วน Margin of Safety ที่คุ้มค่าความเสี่ยงมากขึ้น`
      ];
    }

    return NextResponse.json({
      symbol,
      name,
      score,
      summary: bullets
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
