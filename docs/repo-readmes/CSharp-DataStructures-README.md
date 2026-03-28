# 📊 C# Data Structures — Homework Collection

<div align="center">

  <h3>การบ้าน Data Structures ด้วย C# — Array, SortedList, Hashtable</h3>

  <p>
    <img src="https://img.shields.io/badge/C%23-.NET-purple?logo=csharp" alt="C#"/>
    <img src="https://img.shields.io/badge/Data_Structures-learning-blue" alt="Data Structures"/>
    <img src="https://img.shields.io/badge/type-homework-yellow" alt="Homework"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

รวมการบ้านเรื่อง Data Structures ใน C# ครอบคลุมหัวข้อ Array, SortedList, และ Hashtable

> 💡 ดู repo แยกได้ที่:
> - [Array-App-HW](https://github.com/NnopponS/Array-App-HW)
> - [SortedList-HW](https://github.com/NnopponS/SortedList-HW)
> - [Sorted-List-Tutorial](https://github.com/NnopponS/Sorted-List-Tutorial)
> - [HashtableApp-HW](https://github.com/NnopponS/HashtableApp-HW)

---

## 🗂️ Array-App-HW

**หัวข้อ:** การใช้งาน Array ใน C#

```csharp
// การสร้างและจัดการ Array
int[] numbers = new int[5] { 1, 2, 3, 4, 5 };
string[] names = { "Alice", "Bob", "Charlie" };

// การวนลูปผ่าน Array
foreach (var item in numbers) {
    Console.WriteLine(item);
}

// 2D Array
int[,] matrix = new int[3, 3];
```

**สิ่งที่เรียนรู้:**
- One-dimensional arrays
- Multi-dimensional arrays
- Array methods (Sort, Reverse, IndexOf)
- Array iteration

---

## 📋 SortedList-HW & Sorted-List-Tutorial

**หัวข้อ:** การใช้งาน SortedList ใน C#

```csharp
// SortedList — เก็บข้อมูลแบบ key-value เรียงลำดับอัตโนมัติ
SortedList<string, int> scores = new SortedList<string, int>();
scores.Add("Alice", 95);
scores.Add("Charlie", 88);
scores.Add("Bob", 92);

// ข้อมูลจะถูกเรียงตาม key โดยอัตโนมัติ
foreach (var item in scores) {
    Console.WriteLine($"{item.Key}: {item.Value}");
}
// Output: Alice: 95, Bob: 92, Charlie: 88
```

**สิ่งที่เรียนรู้:**
- SortedList vs List vs Dictionary
- Key-value pair operations
- Automatic sorting behavior
- LINQ queries on SortedList

---

## #️⃣ HashtableApp-HW

**หัวข้อ:** การใช้งาน Hashtable และ Dictionary ใน C#

```csharp
// Hashtable (non-generic)
Hashtable ht = new Hashtable();
ht["name"] = "Alice";
ht["age"] = 20;

// Dictionary<K,V> (generic — แนะนำ)
Dictionary<string, int> dict = new Dictionary<string, int>();
dict["apple"] = 5;
dict["banana"] = 3;

// Check if key exists
if (dict.ContainsKey("apple")) {
    Console.WriteLine(dict["apple"]); // 5
}
```

**สิ่งที่เรียนรู้:**
- Hash function concept
- Hashtable vs Dictionary
- Collision handling
- O(1) average lookup complexity

---

## 🚀 การรัน

```bash
# เปิดใน Visual Studio
# เลือก project ที่ต้องการ
# กด F5 เพื่อ run
```

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University (2022)
