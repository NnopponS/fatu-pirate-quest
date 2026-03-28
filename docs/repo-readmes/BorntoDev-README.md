# 🎓 BorntoDev C# — คอร์สเรียน C# OOP

<div align="center">

  <h3>โปรเจคและการบ้านจากคอร์ส C# OOP ของ BorntoDev</h3>

  <p>
    <img src="https://img.shields.io/badge/C%23-.NET-purple?logo=csharp" alt="C#"/>
    <img src="https://img.shields.io/badge/OOP-concepts-blue" alt="OOP"/>
    <img src="https://img.shields.io/badge/BorntoDev-course-orange" alt="BorntoDev"/>
    <img src="https://img.shields.io/badge/type-learning-green" alt="Learning"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

รวมโปรเจคและแบบฝึกหัดจากคอร์ส **C# Object-Oriented Programming** ของ BorntoDev ครอบคลุมแนวคิด OOP ทั้งหมดและ Data Structures ต่างๆ

> 🍴 Forked from [Jaylateaux/BorntoDev](https://github.com/Jaylateaux/BorntoDev)

## 🏗️ โครงสร้าง Solution

```
BorntoDev/
├── ConsoleApp1/        # Hello World & Basic I/O
├── ConsoleApp2/        # Variables & Operators
├── Array/              # One-dimensional arrays
├── array2/             # Multi-dimensional arrays
├── ArrayListApp/       # ArrayList collection
├── ClassLesson/        # Classes & Objects
├── Constructor/        # Constructors
├── Inheritance/        # Inheritance & Polymorphism
├── Abstract/           # Abstract classes & Interfaces
├── GUIHomework/        # Windows Forms GUI
├── HelloWorldGUI/      # First GUI app
├── SortedList/         # SortedList collection
├── SortedListApp/      # SortedList practice
├── HashTableApp/       # Hashtable collection
├── StackApp/           # Stack data structure
├── QueueApp/           # Queue data structure
├── SQLiteApp/          # SQLite database
└── BorntoDev.sln       # Visual Studio Solution
```

## 📚 หัวข้อที่เรียน

### 🔷 OOP Concepts
| หัวข้อ | โฟลเดอร์ |
|--------|---------|
| Classes & Objects | `ClassLesson/` |
| Constructors | `Constructor/` |
| Inheritance | `Inheritance/` |
| Abstract & Interface | `Abstract/` |

### 📊 Data Structures
| Structure | โฟลเดอร์ |
|-----------|---------|
| Array | `Array/`, `array2/` |
| ArrayList | `ArrayListApp/` |
| SortedList | `SortedList/`, `SortedListApp/` |
| Hashtable | `HashTableApp/` |
| Stack | `StackApp/` |
| Queue | `QueueApp/` |

### 🖥️ GUI & Database
| หัวข้อ | โฟลเดอร์ |
|--------|---------|
| Windows Forms | `HelloWorldGUI/`, `GUIHomework/` |
| SQLite | `SQLiteApp/` |

## 💡 ตัวอย่างโค้ดน่าสนใจ

### Inheritance
```csharp
public class Animal {
    public string Name { get; set; }
    public virtual void Speak() => Console.WriteLine("...");
}

public class Dog : Animal {
    public override void Speak() => Console.WriteLine($"{Name} says: Woof!");
}

public class Cat : Animal {
    public override void Speak() => Console.WriteLine($"{Name} says: Meow!");
}
```

### Stack & Queue
```csharp
// Stack — Last In, First Out (LIFO)
Stack<int> stack = new Stack<int>();
stack.Push(1); stack.Push(2); stack.Push(3);
Console.WriteLine(stack.Pop()); // 3

// Queue — First In, First Out (FIFO)
Queue<string> queue = new Queue<string>();
queue.Enqueue("First"); queue.Enqueue("Second");
Console.WriteLine(queue.Dequeue()); // First
```

## 🚀 การรัน

```bash
# เปิดไฟล์ BorntoDev.sln ใน Visual Studio
# เลือก StartUp Project ที่ต้องการ (Right-click → Set as Startup Project)
# กด F5 เพื่อ run
```

## 👨‍💻 Developer

**Noppon Sangsasri** — เรียนจาก BorntoDev (2021)

---

<div align="center">
  <p>🎓 Learning C# OOP — from basics to advanced concepts</p>
  <p><a href="https://www.borntodev.com">BorntoDev.com</a></p>
</div>
