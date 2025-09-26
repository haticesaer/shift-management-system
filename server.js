const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, 'ariza_durus.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('SQLite veritabanına bağlandı:', dbPath);
        createTables();
    }
});

// Tabloları oluştur
function createTables() {
    const createTableSQL = `
                            CREATE TABLE IF NOT EXISTS ariza_kayitlar (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        durum_tipi TEXT NOT NULL,
                        tarih TEXT NOT NULL,
                        baslangic_saati TEXT NOT NULL,
                        bitis_saati TEXT NOT NULL,
                        vardiya TEXT NOT NULL,
                        birim TEXT NOT NULL,
                        lokasyon TEXT NOT NULL,
                        cihaz_adi TEXT NOT NULL,
                        muhendis_adi TEXT NOT NULL,
                        yapilan_is TEXT NOT NULL,
                        tonaj INTEGER NOT NULL,
                        kayit_tarihi TEXT NOT NULL
                    )
    `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Tablo oluşturma hatası:', err.message);
        } else {
            console.log('ariza_kayitlar tablosu hazır');
        }
    });
}

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Tüm kayıtları getir
app.get('/api/kayitlar', (req, res) => {
    const sql = 'SELECT * FROM ariza_kayitlar ORDER BY kayit_tarihi DESC';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Kayıt ekle
app.post('/api/kayitlar', (req, res) => {
    const {
        durumTipi,
        tarih,
        baslangicSaati,
        bitisSaati,
        vardiya,
        birim,
        lokasyon,
        cihazAdi,
        muhendisAdi,
        yapilanIs,
        tonaj
    } = req.body;

    const kayitTarihi = new Date().toISOString();

    const sql = `
        INSERT INTO ariza_kayitlar 
        (durum_tipi, tarih, baslangic_saati, bitis_saati, vardiya, birim, lokasyon, cihaz_adi, muhendis_adi, yapilan_is, tonaj, kayit_tarihi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        durumTipi,
        tarih,
        baslangicSaati,
        bitisSaati,
        vardiya,
        birim,
        lokasyon,
        cihazAdi,
        muhendisAdi,
        yapilanIs,
        tonaj,
        kayitTarihi
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            id: this.lastID,
            durumTipi,
            tarih,
            baslangicSaati,
            bitisSaati,
            vardiya,
            birim,
            lokasyon,
            cihazAdi,
            muhendisAdi,
            yapilanIs,
            kayitTarihi
        });
    });
});

// Kayıt güncelle
app.put('/api/kayitlar/:id', (req, res) => {
    const { id } = req.params;
    const {
        durumTipi,
        tarih,
        baslangicSaati,
        bitisSaati,
        vardiya,
        birim,
        lokasyon,
        cihazAdi,
        muhendisAdi,
        yapilanIs
    } = req.body;

    const sql = `
        UPDATE ariza_kayitlar 
        SET durum_tipi = ?, tarih = ?, baslangic_saati = ?, bitis_saati = ?, 
            vardiya = ?, birim = ?, lokasyon = ?, cihaz_adi = ?, 
            muhendis_adi = ?, yapilan_is = ?
        WHERE id = ?
    `;

    const params = [
        durumTipi,
        tarih,
        baslangicSaati,
        bitisSaati,
        vardiya,
        birim,
        lokasyon,
        cihazAdi,
        muhendisAdi,
        yapilanIs,
        id
    ];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Kayıt bulunamadı' });
            return;
        }
        
        res.json({
            id,
            durumTipi,
            tarih,
            baslangicSaati,
            bitisSaati,
            vardiya,
            birim,
            lokasyon,
            cihazAdi,
            muhendisAdi,
            yapilanIs
        });
    });
});

// Kayıt sil
app.delete('/api/kayitlar/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM ariza_kayitlar WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Kayıt bulunamadı' });
            return;
        }
        
        res.json({ message: 'Kayıt başarıyla silindi' });
    });
});

// Arama yap
app.get('/api/kayitlar/search', (req, res) => {
    const { searchTerm, filterDurum, filterVardiya } = req.query;
    
    let sql = 'SELECT * FROM ariza_kayitlar WHERE 1=1';
    const params = [];

    if (searchTerm) {
        sql += ' AND (yapilan_is LIKE ? OR lokasyon LIKE ? OR cihaz_adi LIKE ? OR muhendis_adi LIKE ?)';
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (filterDurum) {
        sql += ' AND durum_tipi = ?';
        params.push(filterDurum);
    }

    if (filterVardiya) {
        sql += ' AND vardiya = ?';
        params.push(filterVardiya);
    }

    sql += ' ORDER BY kayit_tarihi DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Veritabanı durumu
app.get('/api/status', (req, res) => {
    res.json({
        isConnected: true,
        databaseType: 'SQLite',
        name: 'ariza_durus.db',
        path: dbPath
    });
});

// Server'ı başlat
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Veritabanı: ${dbPath}`);
    console.log('DBeaver\'da bu dosyaya bağlanabilirsiniz!');
});
