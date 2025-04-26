export default class Data {
  static set(key: string, value: any) {
    localStorage.setItem(key, value);
  }
  static setJSON(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  static get(key: string): any {
    localStorage.getItem(key);
  }
  static getJSON(key: string) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : data;
    } catch {
      return null;
    }
  }
}
