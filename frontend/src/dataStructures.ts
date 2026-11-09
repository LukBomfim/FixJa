interface ListNode<T> {
  value: T;
  next: ListNode<T> | null;
}

export class LinkedList<T> implements Iterable<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private count = 0;

  get size(): number {
    return this.count;
  }

  append(value: T): void {
    const node: ListNode<T> = { value, next: null };
    if (this.tail) this.tail.next = node;
    else this.head = node;
    this.tail = node;
    this.count += 1;
  }

  find(predicate: (value: T) => boolean): T | undefined {
    for (const value of this) if (predicate(value)) return value;
    return undefined;
  }

  remove(predicate: (value: T) => boolean): T | undefined {
    let previous: typeof this.head = null;
    let current = this.head;
    while (current) {
      if (predicate(current.value)) {
        if (previous) previous.next = current.next;
        else this.head = current.next;
        if (this.tail === current) this.tail = previous;
        this.count -= 1;
        return current.value;
      }
      previous = current;
      current = current.next;
    }
    return undefined;
  }

  *[Symbol.iterator](): Iterator<T> {
    let current = this.head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

export class Stack<T> {
  private readonly items: T[];

  constructor(items: T[] = []) {
    this.items = [...items];
  }

  push(item: T): void {
    this.items.push(item);
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  toArrayNewestFirst(): T[] {
    return [...this.items].reverse();
  }
}
