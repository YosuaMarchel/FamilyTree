"use strict";

/**
 * ═══════════════════════════════════════════════════════════════
 *  DATA KELUARGA — satu-satunya file yang perlu diedit untuk
 *  mengganti isi pohon keluarga. Lihat README.md untuk panduan.
 * ═══════════════════════════════════════════════════════════════
 *
 *  Aturan penting:
 *  • `id` harus unik dan tidak boleh diubah sembarangan (dipakai
 *    sebagai acuan di `parents` dan `spouses`).
 *  • `parents` berisi id ayah & ibu. Kosongkan ([]) untuk generasi
 *    paling atas atau untuk pasangan yang menikah masuk ke keluarga.
 *  • `spouses` cukup ditulis di SATU sisi saja (relasi otomatis
 *    dibuat dua arah).
 *  • Tulis anggota berdarah keluarga LEBIH DULU, baru pasangannya —
 *    ini menentukan sisi kiri/kanan pada kartu pasangan.
 *  • `photo` diisi path relatif, mis. "assets/photos/nama.jpg".
 *    Jika kosong atau file tidak ditemukan, avatar inisial otomatis
 *    dipakai sebagai gantinya.
 *  • Semua field selain `id`, `name`, dan `gender` bersifat opsional.
 *
 *  Catatan penomoran id:
 *  • Awalan `w1-`…`w4-` = jalur Widyosoesanto (dari Mbah Zidan).
 *  • Awalan `g1-`…`g4-` = jalur Rompas, penomoran lama sebelum tiga
 *    generasi di atasnya masuk. Jadi `g1-welly` sebenarnya sudah
 *    berada pada GENERASI III pohon gabungan ini. Id sengaja tidak
 *    diubah agar acuan lama tetap sah.
 */

const FAMILY_META = Object.freeze({
  familyName: "Keluarga Besar Rompas",
  tagline: "Empat generasi, satu cerita",
  footer: "Silsilah Keluarga Rompas · dibuat dengan penuh sayang",
});

const FAMILY_DATA = Object.freeze([

  /* ═══ GENERASI I ═══════════════════════════════════════════ */
  {
    id: "w1-zidan",
    name: "Mbah Zidan",
    nickname: "Embah Buyut",
    gender: "M",  // Belum ditegaskan sumber; sementara dianggap kakung.
    photo: "",
    parents: [],
    spouses: [],
    funFacts: [
      "Dimakamkan di Bonoloyo, Solo — dekat makam ayah Mas Anto.",
      "Nama lengkap dan nama pasangannya belum diketahui.",
    ],
  },

  /* ═══ GENERASI II ══════════════════════════════════════════
     Enam putra-putri Mbah Zidan, urut sesuai penuturan.          */
  {
    id: "w2-bei",
    name: "Mbah Bei",
    gender: "F",
    photo: "",
    domicile: "Solo, Jawa Tengah",
    parents: ["w1-zidan"],
    spouses: [],
    funFacts: [
      "Tinggal di dalam kompleks Taman Tirtonadi, Solo.",
      "Dikenang cantik sekali sampai masa sepuhnya.",
    ],
  },
  {
    id: "w2-karto",
    name: "Mbah Karto",
    gender: "M",  // Belum ditegaskan sumber.
    photo: "",
    parents: ["w1-zidan"],
    spouses: [],
  },
  {
    id: "w2-suwadi",
    name: "Suwadi Kartodihardjo",
    nickname: "Mbah Kakung Suwadi",
    gender: "M",
    photo: "",
    parents: ["w1-zidan"],
    spouses: ["w2-salamah", "w2-sutarti"],
    funFacts: [
      "Menikah empat kali. Hanya dari Siti Salamah beliau memperoleh keturunan, yaitu Soegiarto — satu-satunya putra.",
      "Dua istri di antara Siti Salamah dan Sutarti belum diketahui namanya; ketiga istri setelah Salamah tidak berputra.",
    ],
  },
  {
    id: "w2-salamah",
    name: "Siti Salamah",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
    funFacts: [
      "Ayahnya orang Arab langsung dari Hadramaut, sempat menetap dengan keluarga besarnya di komunitas Arab Pasar Kliwon, Solo, lalu kondur ke negeri leluhurnya. Namanya belum diketahui.",
      "Sedo ketika Soegiarto berumur kira-kira tujuh bulan, saat tedhak siti.",
    ],
  },
  {
    id: "w2-sutarti",
    name: "Sutarti",
    nickname: "Mbah Bawok",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
    funFacts: ["Istri terakhir Mbah Suwadi Kartodihardjo; tidak berputra."],
  },
  {
    id: "w2-joyo",
    name: "Mbah Joyo",
    gender: "M",  // Belum ditegaskan sumber.
    photo: "",
    parents: ["w1-zidan"],
    spouses: [],
  },
  {
    id: "w2-sukarti",
    name: "Sukarti",
    gender: "F",
    photo: "",
    domicile: "Solo, Jawa Tengah",
    parents: ["w1-zidan"],
    spouses: ["w2-atowidjoto"],
    funFacts: [
      "Sekeluarga tinggal di Ngemplak Wetan BPM.",
      "Bersama suaminya mengangkat Soegiarto — keponakannya sendiri — sebagai putra.",
    ],
  },
  {
    id: "w2-atowidjoto",
    name: "Atowidjoto",
    gender: "M",
    photo: "",
    parents: [],
    spouses: [],
  },
  {
    id: "w2-marmo",
    name: "Eyang Marmo",
    gender: "M",  // Belum ditegaskan sumber.
    photo: "",
    domicile: "Solo, Jawa Tengah",
    parents: ["w1-zidan"],
    spouses: [],
    funFacts: [
      "Putra ragil (bungsu) Mbah Zidan.",
      "Dulu tinggal di Jl. Kawi, Jakarta, kemudian kondur ke Solo.",
    ],
  },

  /* ═══ GENERASI III ═════════════════════════════════════════ */

  /* — jalur Mbah Bei — */
  {
    id: "w3-dulah",
    name: "Budhe Dulah",
    gender: "F",
    photo: "",
    parents: ["w2-bei"],
    spouses: [],
  },
  {
    id: "w3-tejo",
    name: "Pakdhe Tejo",
    gender: "M",
    photo: "",
    parents: ["w2-bei"],
    spouses: [],
  },

  /* — jalur Mbah Karto — */
  {
    id: "w3-gito",
    name: "Pakde Gito",
    gender: "M",
    photo: "",
    domicile: "Solo, Jawa Tengah",
    parents: ["w2-karto"],
    spouses: [],
    funFacts: [
      "Tinggal di Singosaren, Solo.",
      "Ayah dari Mas Ratman dan saudara-saudaranya.",
    ],
  },
  {
    id: "w3-tarto",
    name: "Pakde Tarto",
    gender: "M",
    photo: "",
    domicile: "Solo, Jawa Tengah",
    parents: ["w2-karto"],
    spouses: [],
    funFacts: ["Tinggal di Singosaren, Solo."],
  },

  /* — jalur Mbah Suwadi Kartodihardjo — */
  {
    id: "w3-soegiarto",
    name: "Soegiarto Widyosoesanto",
    nickname: "Bapak Soegiarto Ws.",
    gender: "M",
    photo: "",
    parents: ["w2-suwadi", "w2-salamah"],
    spouses: ["w3-soepadmi"],
    funFacts: [
      "Satu-satunya putra Mbah Kakung Suwadi Kartodihardjo, lahir dari pernikahan dengan Siti Salamah.",
      "Menjadi piatu pada umur kira-kira tujuh bulan, lalu berpindah-pindah asuhan: mbah putri di Singosaren, keluarga ayah ibunya di Pasar Kliwon, dan keluarga Atowidjoto.",
      "Diangkat sebagai putra oleh Sukarti dan Bapak Atowidjoto — bibinya sendiri — sehingga sekaligus keponakan dan anak angkat di keluarga itu.",
      "Sebelas putra-putrinya dianggap generasi pertama Keluarga Soegiarto Widyosoesanto.",
    ],
  },
  {
    id: "w3-soepadmi",
    name: "Soepadmi Widyosoesanto",
    nickname: "Mbah mBatu",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
    funFacts: [
      "Putri Kromowirjono.",
      "Dari beliaulah asal sebutan “keluarga mBatu”.",
    ],
  },

  /* — jalur Mbah Joyo — */
  {
    id: "w3-sukadji",
    name: "Sukadji",
    nickname: "Pak Sukadji",
    gender: "M",
    photo: "",
    parents: ["w2-joyo"],
    spouses: [],
  },
  {
    // Nama sementara — putra Mbah Joyo, namanya belum teringat penutur.
    id: "w3-putra-joyo",
    name: "Putra Mbah Joyo",
    gender: "M",
    photo: "",
    parents: ["w2-joyo"],
    spouses: [],
    funFacts: ["Disebut sebagai “Om…” — namanya belum teringat."],
  },

  /* — jalur Sukarti & Atowidjoto — */
  {
    id: "w3-kartini",
    name: "Kartini",
    gender: "F",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-ami",
    name: "Bu Ami",
    gender: "F",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
    funFacts: ["Ibu dari Nata, Anna, dan Nuel."],
  },
  {
    id: "w3-suharno",
    name: "Suharno",
    gender: "M",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-supraapti",
    name: "Supraapti",
    gender: "F",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-prayitno",
    name: "Prayitno",
    gender: "M",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-darono",
    name: "Darono",
    gender: "M",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-siwi",
    name: "Siwi Utami",
    gender: "F",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-sini",
    name: "Sini Hadiningsih",
    gender: "F",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
  },
  {
    id: "w3-setyaningsih",
    name: "Siti Setyaningsih",
    gender: "F",
    photo: "",
    parents: ["w2-sukarti", "w2-atowidjoto"],
    spouses: [],
    funFacts: ["Putri ragil (bungsu)."],
  },

  /* — jalur Eyang Marmo — */
  {
    id: "w3-cemplon",
    name: "Mbak Cemplon",
    gender: "F",
    photo: "",
    parents: ["w2-marmo"],
    spouses: [],
    funFacts: [
      "Putri angkat Eyang Marmo.",
      "“Cemplon” adalah nama panggilan; nama aslinya belum diketahui.",
    ],
  },

  /* — jalur Rompas (setara generasi ini) — */
  {
    id: "g1-welly",
    name: "Welly Rompas",
    gender: "M",
    photo: "",
    parents: [],
    spouses: ["g1-frida"],
  },
  {
    id: "g1-frida",
    name: "Frida Tamar Sampouw",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
  },

  /* ═══ GENERASI IV ══════════════════════════════════════════ */

  /* — jalur Rompas — */
  {
    id: "g2-alfreds",
    name: "Alfreds Rompas",
    gender: "M",
    photo: "",
    parents: ["g1-welly", "g1-frida"],
    spouses: ["g2-istri1-alfreds", "g2-olfie"],
  },
  {
    // Nama sementara — istri pertama Alfreds, detail menyusul.
    id: "g2-istri1-alfreds",
    name: "Istri Pertama Alfreds",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
  },
  {
    id: "g2-olfie",
    name: "Olfie Meiske Pandelaki",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
  },
  {
    id: "g2-olga",
    name: "Olga Paula Rompas",
    gender: "F",
    photo: "",
    parents: ["g1-welly", "g1-frida"],
    spouses: ["g2-sunu"],
  },
  {
    // Titik sambung dua jalur: putra ke-9 Soegiarto Ws., menikah dengan
    // Olga Paula Rompas. Urutan entri (Olga lebih dulu) menentukan bahwa
    // garis keturunan yang digambar adalah garis Rompas — lihat catatan
    // di README bila ingin dibalik ke garis Widyosoesanto.
    id: "g2-sunu",
    name: "Sunu Waspodo",
    gender: "M",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "g2-nolvi",
    name: "Nolvi Michael Rompas",
    gender: "M",
    photo: "",
    parents: ["g1-welly", "g1-frida"],
    spouses: ["g2-novi"],
  },
  {
    id: "g2-novi",
    name: "Novi",
    gender: "F",
    photo: "",
    parents: [],
    spouses: [],
  },

  /* — sebelas putra-putri Soegiarto Ws. & Soepadmi, urut kelahiran.
       Nomor 9, Sunu Waspodo, ditulis di blok Rompas di atas.        */
  {
    id: "w4-soesanti",
    name: "Soesanti",
    gender: "F",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-soegiardjo",
    name: "Soegiardjo",
    gender: "M",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-ristiningsih",
    name: "Ristiningsih",
    nickname: "Budhe Ris",
    gender: "F",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-agus",
    name: "Agus Soepadmo",
    gender: "M",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-sihwidi",
    name: "Sih Widi Utami",
    gender: "F",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-setyadi",
    name: "Setyadi",
    gender: "M",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-mangesti",
    name: "Mangesti Rahayu",
    gender: "F",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
    funFacts: ["Telah berpulang (almarhumah); tanggalnya belum tercatat."],
  },
  {
    id: "w4-setyawan",
    name: "Setyawan",
    gender: "M",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-sudibyo",
    name: "Emanuel Sudibyo",
    gender: "M",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },
  {
    id: "w4-yekti",
    name: "Natalina Yekti Nugraheni",
    gender: "F",
    photo: "",
    parents: ["w3-soegiarto", "w3-soepadmi"],
    spouses: [],
  },

  /* — cucu Mbah Karto & Sukarti yang sempat disebut namanya — */
  {
    id: "w4-ratman",
    name: "Mas Ratman",
    gender: "M",
    photo: "",
    parents: ["w3-gito"],
    spouses: [],
    funFacts: ["Masih ada saudara-saudara lain yang belum tercatat namanya."],
  },
  {
    id: "w4-nata",
    name: "Nata",
    gender: "M",  // Belum ditegaskan sumber.
    photo: "",
    parents: ["w3-ami"],
    spouses: [],
  },
  {
    id: "w4-anna",
    name: "Anna",
    gender: "F",
    photo: "",
    parents: ["w3-ami"],
    spouses: [],
  },
  {
    id: "w4-nuel",
    name: "Nuel",
    gender: "M",
    photo: "",
    parents: ["w3-ami"],
    spouses: [],
  },

  /* ═══ GENERASI V ═══════════════════════════════════════════ */
  {
    id: "g3-muthia",
    name: "Muthia Fatmala",
    gender: "F",
    photo: "",
    parents: ["g2-alfreds", "g2-istri1-alfreds"],
    spouses: ["g3-suami1-muthia"],
  },
  {
    // Nama sementara — suami pertama Muthia, detail menyusul.
    id: "g3-suami1-muthia",
    name: "Suami Muthia",
    gender: "M",
    photo: "",
    parents: [],
    spouses: [],
  },
  {
    id: "g3-latifa",
    name: "Latifa Auliya Ocraviani",
    gender: "F",
    photo: "",
    parents: ["g2-alfreds", "g2-istri1-alfreds"],
    spouses: [],
  },
  {
    id: "g3-aldo",
    name: "Aldo Welfen Rompas",
    gender: "M",
    photo: "",
    parents: ["g2-alfreds", "g2-olfie"],
    spouses: [],
  },
  {
    id: "g3-yosua",
    name: "Yosua Marchel",
    gender: "M",
    photo: "",
    parents: ["g2-olga", "g2-sunu"],
    spouses: [],
  },
  {
    id: "g3-jhouan",
    name: "Jhouan Stevanus",
    gender: "M",
    photo: "",
    parents: ["g2-olga", "g2-sunu"],
    spouses: [],
  },
  {
    id: "g3-dialucita",
    name: "Dialucita Falha Anabella Rompas",
    gender: "F",
    photo: "",
    parents: ["g2-nolvi", "g2-novi"],
    spouses: [],
  },

  /* ═══ GENERASI VI ══════════════════════════════════════════ */
  {
    id: "g4-bilqis",
    name: "Bilqis Nur Khalisa",
    gender: "F",
    photo: "",
    parents: ["g3-muthia", "g3-suami1-muthia"],
    spouses: [],
  },
  {
    id: "g4-zhafira",
    name: "Zhafira Nur Robbani",
    gender: "F",
    photo: "",
    parents: ["g3-muthia", "g3-suami1-muthia"],
    spouses: [],
  },
]);
