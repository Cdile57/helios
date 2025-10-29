export type Vec3 = [number, number, number]
export type CustState = 'entering' | 'seated' | 'toilet_move' | 'toilet_wait' | 'toilet_inside' | 'leaving' | 'done'

export type Customer = {
  id: number
  pos: Vec3
  target: Vec3
  state: CustState
  color: string
  seatIndex: number | null
  toiletTimer: number
  stayLeftSec: number
}

export type Seat = {
  id: number
  pos: Vec3
  occupiedBy: number | null
}

export type Metrics = {
  t: number           // 経過秒
  occupancy: number   // 稼働率 [0..1]
  waitAvgSec: number  // 平均待ち秒（ダミー指標）
  throughputPerHr: number
  inStore: number     // 滞在中人数
  toiletQueue: number // トイレ待ち人数
}
