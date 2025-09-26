// API Veritabanı İşlemleri
class DatabaseManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.useLocalStorage = false; // Varsayılan olarak API kullan
        this.initDatabase();
    }

    // Veritabanını başlat
    async initDatabase() {
        try {
            // API bağlantısını test et
            const response = await fetch(`${this.apiBaseUrl}/status`);
            if (response.ok) {
                const status = await response.json();
                console.log('API veritabanı başarıyla başlatıldı:', status);
                this.useLocalStorage = false;
            } else {
                throw new Error('API bağlantısı başarısız');
            }
        } catch (error) {
            console.error('API başlatma hatası:', error);
            // Fallback olarak localStorage kullan
            this.useLocalStorage = true;
        }
    }

    // Kayıt ekle
    async addKayit(kayit) {
        if (this.useLocalStorage) {
            return this.addToLocalStorage(kayit);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/kayitlar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(kayit)
            });

            if (!response.ok) {
                throw new Error('Kayıt eklenemedi');
            }

            const savedKayit = await response.json();
            return savedKayit;
        } catch (error) {
            console.error('Kayıt ekleme hatası:', error);
            throw error;
        }
    }

    // Kayıt güncelle
    async updateKayit(kayit) {
        if (this.useLocalStorage) {
            return this.updateInLocalStorage(kayit);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/kayitlar/${kayit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(kayit)
            });

            if (!response.ok) {
                throw new Error('Kayıt güncellenemedi');
            }

            const updatedKayit = await response.json();
            return updatedKayit;
        } catch (error) {
            console.error('Kayıt güncelleme hatası:', error);
            throw error;
        }
    }

    // Kayıt sil
    async deleteKayit(id) {
        if (this.useLocalStorage) {
            return this.deleteFromLocalStorage(id);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/kayitlar/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Kayıt silinemedi');
            }

            return await response.json();
        } catch (error) {
            console.error('Kayıt silme hatası:', error);
            throw error;
        }
    }

    // Tüm kayıtları getir
    async getAllKayitlar() {
        if (this.useLocalStorage) {
            return this.getAllFromLocalStorage();
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/kayitlar`);
            if (!response.ok) {
                throw new Error('Kayıtlar getirilemedi');
            }

            const kayitlar = await response.json();
            return kayitlar.map(row => ({
                id: row.id,
                durumTipi: row.durum_tipi,
                tarih: row.tarih,
                baslangicSaati: row.baslangic_saati,
                bitisSaati: row.bitis_saati,
                vardiya: row.vardiya,
                birim: row.birim,
                lokasyon: row.lokasyon,
                cihazAdi: row.cihaz_adi,
                muhendisAdi: row.muhendis_adi,
                yapilanIs: row.yapilan_is,
                tonaj: row.tonaj,
                kayitTarihi: row.kayit_tarihi
            }));
        } catch (error) {
            console.error('Kayıtlar getirilemedi:', error);
            return [];
        }
    }

    // ID'ye göre kayıt getir
    async getKayitById(id) {
        if (this.useLocalStorage) {
            return this.getFromLocalStorageById(id);
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/kayitlar/${id}`);
            if (!response.ok) {
                return null;
            }

            const row = await response.json();
            return {
                id: row.id,
                durumTipi: row.durum_tipi,
                tarih: row.tarih,
                baslangicSaati: row.baslangic_saati,
                bitisSaati: row.bitis_saati,
                vardiya: row.vardiya,
                birim: row.birim,
                lokasyon: row.lokasyon,
                cihazAdi: row.cihaz_adi,
                muhendisAdi: row.muhendis_adi,
                yapilanIs: row.yapilan_is,
                tonaj: row.tonaj,
                kayitTarihi: row.kayit_tarihi
            };
        } catch (error) {
            console.error('Kayıt getirilemedi:', error);
            return null;
        }
    }

    // Arama yap
    async searchKayitlar(searchTerm, filterDurum, filterVardiya) {
        if (this.useLocalStorage) {
            return this.searchInLocalStorage(searchTerm, filterDurum, filterVardiya);
        }

        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('searchTerm', searchTerm);
            if (filterDurum) params.append('filterDurum', filterDurum);
            if (filterVardiya) params.append('filterVardiya', filterVardiya);

            const response = await fetch(`${this.apiBaseUrl}/kayitlar/search?${params}`);
            if (!response.ok) {
                throw new Error('Arama yapılamadı');
            }

            const kayitlar = await response.json();
            return kayitlar.map(row => ({
                id: row.id,
                durumTipi: row.durum_tipi,
                tarih: row.tarih,
                baslangicSaati: row.baslangic_saati,
                bitisSaati: row.bitis_saati,
                vardiya: row.vardiya,
                birim: row.birim,
                lokasyon: row.lokasyon,
                cihazAdi: row.cihaz_adi,
                muhendisAdi: row.muhendis_adi,
                yapilanIs: row.yapilan_is,
                tonaj: row.tonaj,
                kayitTarihi: row.kayit_tarihi
            }));
        } catch (error) {
            console.error('Arama hatası:', error);
            return [];
        }
    }

    // LocalStorage fallback metodları
    addToLocalStorage(kayit) {
        const kayitlar = JSON.parse(localStorage.getItem('arizaKayitlar')) || [];
        kayit.id = Date.now().toString();
        kayitlar.unshift(kayit);
        localStorage.setItem('arizaKayitlar', JSON.stringify(kayitlar));
        return Promise.resolve(kayit);
    }

    updateInLocalStorage(kayit) {
        const kayitlar = JSON.parse(localStorage.getItem('arizaKayitlar')) || [];
        const index
         = kayitlar.findIndex(k => k.id === kayit.id);
        if (index !== -1) {
            kayitlar[index] = kayit;
            localStorage.setItem('arizaKayitlar', JSON.stringify(kayitlar));
        }
        return Promise.resolve(kayit);
    }

    deleteFromLocalStorage(id) {
        const kayitlar = JSON.parse(localStorage.getItem('arizaKayitlar')) || [];
        const filteredKayitlar = kayitlar.filter(k => k.id !== id);
        localStorage.setItem('arizaKayitlar', JSON.stringify(filteredKayitlar));
        return Promise.resolve();
    }

    getAllFromLocalStorage() {
        const kayitlar = JSON.parse(localStorage.getItem('arizaKayitlar')) || [];
        return Promise.resolve(kayitlar);
    }

    getFromLocalStorageById(id) {
        const kayitlar = JSON.parse(localStorage.getItem('arizaKayitlar')) || [];
        const kayit = kayitlar.find(k => k.id === id);
        return Promise.resolve(kayit || null);
    }

    searchInLocalStorage(searchTerm, filterDurum, filterVardiya) {
        const kayitlar = JSON.parse(localStorage.getItem('arizaKayitlar')) || [];
        let filteredKayitlar = kayitlar;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredKayitlar = filteredKayitlar.filter(kayit => 
                kayit.yapilanIs.toLowerCase().includes(term) ||
                kayit.lokasyon.toLowerCase().includes(term) ||
                kayit.cihazAdi.toLowerCase().includes(term) ||
                kayit.muhendisAdi.toLowerCase().includes(term)
            );
        }

        if (filterDurum) {
            filteredKayitlar = filteredKayitlar.filter(kayit => kayit.durumTipi === filterDurum);
        }

        if (filterVardiya) {
            filteredKayitlar = filteredKayitlar.filter(kayit => kayit.vardiya === filterVardiya);
        }

        return Promise.resolve(filteredKayitlar);
    }

    // Veritabanı durumunu kontrol et
    getDatabaseStatus() {
        return {
            isConnected: !this.useLocalStorage,
            databaseType: this.useLocalStorage ? 'LocalStorage' : 'Database',
            name: 'ariza_durus.db'
        };
    }

    // Veritabanını temizle (test için)
    async clearDatabase() {
        if (this.useLocalStorage) {
            localStorage.removeItem('arizaKayitlar');
            return Promise.resolve();
        }

        try {
            // API'de clear endpoint'i yok, tüm kayıtları sil
            const kayitlar = await this.getAllKayitlar();
            for (const kayit of kayitlar) {
                await this.deleteKayit(kayit.id);
            }
        } catch (error) {
            console.error('Veritabanı temizleme hatası:', error);
        }
    }
}

// Global veritabanı yöneticisi
const dbManager = new DatabaseManager();
 