import { OrderStatus } from '@/types/database';

export interface OrderStatusMeta {
  value: OrderStatus;
  label: string;
  description: string;
  badgeClass: string;
  stepOrder: number;
}

export const ORDER_STATUS_LIST: OrderStatusMeta[] = [
  {
    value: 'pending_review',
    label: 'รอตรวจสอบ',
    description: 'ร้านค้าได้รับคำสั่งซื้อแล้ว กำลังตรวจสอบข้อมูลและรายละเอียดป้าย',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
    stepOrder: 1,
  },
  {
    value: 'awaiting_payment',
    label: 'รอชำระเงิน',
    description: 'ตรวจสอบรายละเอียดเรียบร้อย รอลูกค้าชำระเงินตามยอดสุทธิ',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-200',
    stepOrder: 2,
  },
  {
    value: 'verifying_payment',
    label: 'รอตรวจสอบการชำระเงิน',
    description: 'ลูกค้าแจ้งชำระเงินแล้ว กำลังตรวจสอบยอดโอน',
    badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    stepOrder: 3,
  },
  {
    value: 'designing',
    label: 'กำลังออกแบบ',
    description: 'นักออกแบบกำลังจัดวางข้อความ เทมเพลต และของตกแต่งพาสเทลให้คุณ',
    badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
    stepOrder: 4,
  },
  {
    value: 'awaiting_confirmation',
    label: 'รอลูกค้ายืนยันแบบ',
    description: 'ส่งดราฟต์แบบป้ายให้ลูกค้าตรวจทานความถูกต้องแล้ว',
    badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200',
    stepOrder: 5,
  },
  {
    value: 'revising',
    label: 'กำลังแก้ไขงาน',
    description: 'กำลังปรับแก้รายละเอียดตามที่ลูกค้าแจ้งเพิ่มเติม',
    badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    stepOrder: 6,
  },
  {
    value: 'preparing_files',
    label: 'กำลังจัดเตรียมไฟล์',
    description: 'แบบผ่านการยืนยันแล้ว กำลังเรนเดอร์ไฟล์ความละเอียดสูง',
    badgeClass: 'bg-teal-100 text-teal-800 border border-teal-200',
    stepOrder: 7,
  },
  {
    value: 'completed',
    label: 'งานเสร็จแล้ว',
    description: 'ไฟล์ป้ายสำเร็จรูปพร้อมส่งมอบให้ลูกค้า',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    stepOrder: 8,
  },
  {
    value: 'delivered',
    label: 'ส่งมอบงานแล้ว',
    description: 'ส่งมอบไฟล์งานให้ลูกค้าตามช่องทางที่ระบุเรียบร้อยแล้ว',
    badgeClass: 'bg-green-100 text-green-800 border border-green-300',
    stepOrder: 9,
  },
  {
    value: 'cancelled',
    label: 'ยกเลิกคำสั่งซื้อ',
    description: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
    stepOrder: 0,
  },
];

export function getOrderStatusMeta(status: OrderStatus): OrderStatusMeta {
  return (
    ORDER_STATUS_LIST.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      description: '',
      badgeClass: 'bg-gray-100 text-gray-700',
      stepOrder: 1,
    }
  );
}
