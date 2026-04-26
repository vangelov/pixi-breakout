export class ObjectPool {
  private _obj: (new () => unknown) | null = null;

  private _initSize = 0;
  private _currSize = 0;
  private _usageCount = 0;

  private _grow = true;

  private _head: ObjNode | null = null;
  private _tail: ObjNode | null = null;

  private _emptyNode: ObjNode | null = null;
  private _allocNode: ObjNode | null = null;

  /**
   * Creates a new object pool.
   *
   * @param grow If true, the pool grows the first time it becomes empty.
   */
  constructor(grow = false) {
    this._grow = grow;
  }

  /**
   * Unlock all ressources for the garbage collector.
   */
  deconstruct(): void {
    let node: ObjNode | null = this._head;
    let t: ObjNode | null;

    while (node) {
      t = node.next;
      node.next = null;
      node.data = null;
      node = t;
    }

    this._head = this._tail = this._emptyNode = this._allocNode = null;
  }

  /**
   * The pool size.
   */
  get size() {
    return this._currSize;
  }

  /**
   * The total number of 'checked out' objects currently in use.
   */
  get usageCount() {
    return this._usageCount;
  }

  /**
   * The total number of unused thus wasted objects. Use the purge()
   * method to compact the pool.
   *
   * @see #purge
   */
  get wasteCount() {
    return this._currSize - this._usageCount;
  }

  /**
   * Get the next available object from the pool or put it back for the
   * next use. If the pool is empty and resizable, an error is thrown.
   */
  get object(): unknown {
    if (this._usageCount === this._currSize) {
      if (this._grow) {
        this._currSize += this._initSize;

        const n = this._tail;
        let t = this._tail;

        let node: ObjNode;
        for (let i = 0; i < this._initSize; i++) {
          node = new ObjNode();
          if (this._obj) node.data = new this._obj();

          if (t) t.next = node;
          t = node;
        }

        this._tail = t;

        if (this._tail) this._tail.next = this._emptyNode = this._head;
        if (n) this._allocNode = n.next;
        return this.object;
      } else throw new Error("object pool exhausted");
    } else if (this._allocNode) {
      const o = this._allocNode.data;
      this._allocNode.data = null;
      this._allocNode = this._allocNode.next;
      this._usageCount++;
      return o;
    }
  }

  set object(o) {
    if (this._usageCount > 0) {
      this._usageCount--;
      if (this._emptyNode) {
        this._emptyNode.data = o;
        this._emptyNode = this._emptyNode.next;
      }
    }
  }

  /**
   * Allocate the pool by creating all objects from the given class.
   *
   * @param C    The class to instantiate for each object in the pool.
   * @param size The number of objects to create.
   */
  allocate(C: new () => unknown, size: number) {
    this.deconstruct();

    this._obj = C;
    this._initSize = this._currSize = size;

    this._head = this._tail = new ObjNode();
    this._head.data = new this._obj();

    let n: ObjNode | null = null;

    for (let i = 1; i < this._initSize; i++) {
      n = new ObjNode();
      n.data = new this._obj();
      n.next = this._head;
      this._head = n;
    }

    this._emptyNode = this._allocNode = this._head;
    this._tail.next = this._head;
  }

  /**
   * Helper method for applying a function to all objects in the pool.
   *
   * @param func The function's name.
   * @param args The function's arguments.
   */
  initialize(func: string, args: unknown[]): void {
    let n = this._head;
    while (n) {
      (n.data as any)[func].apply(n.data, args); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (n == this._tail) break;
      n = n.next;
    }
  }

  /**
   * Remove all unused objects from the pool. If the number of remaining
   * used objects is smaller than the initial capacity defined by the
   * allocate() method, new objects are created to refill the pool.
   */
  purge() {
    let i: number = 0;
    let node: ObjNode | null = null;

    if (this._usageCount == 0) {
      if (this._currSize == this._initSize) return;

      if (this._currSize > this._initSize) {
        i = 0;
        node = this._head;
        while (++i < this._initSize) if (node) node = node.next;

        this._tail = node;
        this._allocNode = this._emptyNode = this._head;

        this._currSize = this._initSize;
        return;
      }
    } else {
      const a: Array<ObjNode> = [];
      node = this._head;
      while (node) {
        if (!node.data) a[i++] = node;
        if (node == this._tail) break;
        node = node.next;
      }

      this._currSize = a.length;
      this._usageCount = this._currSize;

      this._head = this._tail = a[0];
      for (i = 1; i < this._currSize; i++) {
        node = a[i];
        node.next = this._head;
        this._head = node;
      }

      this._emptyNode = this._allocNode = this._head;
      this._tail.next = this._head;

      if (this._usageCount < this._initSize) {
        this._currSize = this._initSize;

        const n = this._tail;
        let t = this._tail;
        const k = this._initSize - this._usageCount;
        for (i = 0; i < k; i++) {
          node = new ObjNode();
          if (this._obj) node.data = new this._obj();

          t.next = node;
          t = node;
        }

        this._tail = t;

        this._tail.next = this._emptyNode = this._head;
        this._allocNode = n.next;
      }
    }
  }
}

class ObjNode {
  public next: ObjNode | null = null;

  public data: unknown;
}
