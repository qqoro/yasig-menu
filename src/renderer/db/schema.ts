export interface DLSiteProductInfo {
  /**
   * 개발 서클 ID
   */
  maker_id: string;
  age_category: number;
  affiliate_deny: number;
  dl_count: number;
  wishlist_count: number;
  dl_format: number;
  rate_average: number;
  /**
   * 별점 2번째 소수점까지
   */
  rate_average_2dp: number;
  rate_average_star: number;
  rate_count: number;
  review_count: number;
  price: number;
  price_without_tax: number;
  price_str: string;
  default_point_rate: number;
  default_point: number;
  product_point_rate: any;
  dlsiteplay_work: boolean;
  is_ana: boolean;
  is_sale: boolean;
  on_sale: number;
  is_discount: boolean;
  is_pointup: boolean;
  gift: any[];
  is_rental: boolean;
  work_rentals: any[];
  upgrade_min_price: number;
  down_url: string;
  is_tartget: any;
  title_id: any;
  title_name: any;
  title_name_masked: any;
  title_volumn: any;
  title_work_count: any;
  is_title_completed: boolean;
  bulkbuy_key: any;
  bonuses: any[];
  is_limit_work: boolean;
  is_sold_out: boolean;
  limit_stock: number;
  is_reserve_work: boolean;
  is_reservable: boolean;
  is_timesale: boolean;
  timesale_stock: number;
  is_free: boolean;
  is_oly: boolean;
  is_led: boolean;
  is_noreduction: boolean;
  is_wcc: boolean;
  /**
   * 게임 이름
   */
  work_name: string;
  work_name_masked: string;
  /**
   * 썸네일 주소
   */
  work_image: string;
  sales_end_info: any;
  voice_pack: any;
  regist_date: string;
  work_type: string;
  book_type: any;
  discount_calc_type: any;
  is_pack_work: boolean;
  limited_free_terms: any[];
  official_price: number;
  options: string;
  custom_genres: string[];
  dl_count_total: number;
  dl_count_items: any[];
  default_point_str: string;
}
