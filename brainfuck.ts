enum Operate {
    INCREMENT_POINTER,
    DECREMENT_POINTER,
    INCREMENT_VALUE,
    DECREMENT_VALUE,
    PRINT_CURRENT_VALUE,
    SET_TO_CURRENT_VALUE,
    IF_ZERO_TO_JUMP_AFTER,
    IF_NOT_ZERO_TO_JUMP_BEFORE,
}

const OperateTable = {
    '>': Operate.INCREMENT_POINTER,
    '<': Operate.DECREMENT_POINTER,
    '+': Operate.INCREMENT_VALUE,
    '-': Operate.DECREMENT_VALUE,
    '.': Operate.PRINT_CURRENT_VALUE,
    ',': Operate.SET_TO_CURRENT_VALUE,
    '[': Operate.IF_ZERO_TO_JUMP_AFTER,
    ']': Operate.IF_NOT_ZERO_TO_JUMP_BEFORE,
}

function parseCode(code: string) {
    return Array.prototype.map.call(code, (operate) => OperateTable[operate]);
}

function generateJumpTable(code: Operate[]): JumpTable {
    const stack: number[] = [];
    const jumpTable: JumpTable = {};
    for (let i = 0; i < code.length; i++) {
        switch (code[i]) {
            case Operate.IF_ZERO_TO_JUMP_AFTER:
                stack.push(i);
                break;
            case Operate.IF_NOT_ZERO_TO_JUMP_BEFORE:
                const pos = stack.pop();
                jumpTable[i] = pos;
                jumpTable[pos] = i;
                break;
        }
    }
    return jumpTable;
}

interface Memory {
    [index: number]: number;
}

interface JumpTable {
    [i: number]: number;
}

interface InputOutput {
    input: () => string;
    output: (string) => void;
}

interface Command {
    (): void;
}

interface LanguageInterface {
    incrementPointer: Command;
    decrementPointer: Command;
    incrementValue: Command;
    decrementValue: Command;
    printCurrentValue: Command;
    setToCurrentValue: Command;
    ifZeroToJumpAfter: Command;
    ifNotZeroToJumpBefore: Command;
}

class MemoryEnv {
    memory: Memory;
    ptr: number;

    constructor() {
        this.memory = {};
        this.ptr = 0;
    }

    getPointer = () => {
        return this.ptr;
    }

    setPointer = (ptr: number) => {
        this.ptr = ptr;
    }

    setRelativePointer = (offset: number) => {
        this.ptr += offset;
    }

    getValue = () => {
        const value = this.memory[this.ptr];
        return value === undefined ? 0 : value;
    }

    setValue = (value: number) => {
        this.memory[this.ptr] = value;
    }

    setRelativeValue = (offset: number) => {
        this.memory[this.ptr] = this.getValue() + offset;
    }
}

class CodeEnv {
    pc: number;

    constructor(readonly code: Operate[]) {
        this.pc = 0;
    }

    getPc() {
        return this.pc;
    }

    setPc(ptr) {
        this.pc = ptr;
    }

    next() {
        this.pc++;
    }

    atOperate() {
        return this.code[this.pc];
    }

    isOver() {
        return this.pc >= this.code.length;
    }
}

interface CommandTable {
    [operate: number]: Command;
}

interface Parser {
    (string): Operate[];
}

interface BrainFuckParameter {
    readonly io: InputOutput;
    readonly parser?: Parser;
}

class BrainFuck implements LanguageInterface {
    parser: Parser;
    codeEnv: CodeEnv;
    memoryEnv: MemoryEnv;
    jumpTable: JumpTable;
    commandTable: CommandTable;
    io: InputOutput;

    constructor(parameter: BrainFuckParameter) {
        this.io = parameter.io;
        this.parser = parameter.parser || parseCode;
        this.commandTable = {
            [Operate.INCREMENT_POINTER]: this.incrementPointer,
            [Operate.DECREMENT_POINTER]: this.decrementPointer,
            [Operate.INCREMENT_VALUE]: this.incrementValue,
            [Operate.DECREMENT_VALUE]: this.decrementValue,
            [Operate.PRINT_CURRENT_VALUE]: this.printCurrentValue,
            [Operate.SET_TO_CURRENT_VALUE]: this.setToCurrentValue,
            [Operate.IF_ZERO_TO_JUMP_AFTER]: this.ifZeroToJumpAfter,
            [Operate.IF_NOT_ZERO_TO_JUMP_BEFORE]: this.ifNotZeroToJumpBefore,
        }
    }

    run(code: string) {
        const parsedCode = this.parser(code);
        this.jumpTable = generateJumpTable(parsedCode);
        this.codeEnv = new CodeEnv(parsedCode);
        this.memoryEnv = new MemoryEnv();
        while (!this.codeEnv.isOver()) {
            const operate = this.codeEnv.atOperate();
            const command = this.commandTable[operate];
            command();
            this.codeEnv.next();
        }
    }

    incrementPointer = () => {
        this.memoryEnv.setRelativePointer(1);
    }

    decrementPointer = () => {
        this.memoryEnv.setRelativePointer(-1);
    }

    incrementValue = () => {
        this.memoryEnv.setRelativeValue(1);
    }

    decrementValue = () => {
        this.memoryEnv.setRelativeValue(-1);
    }

    printCurrentValue = () => {
        const code = this.memoryEnv.getValue();
        this.io.output(String.fromCharCode(code));
    }

    setToCurrentValue = () => {
        const value = this.io.input();
        this.memoryEnv.setValue(value.charCodeAt(0));
    }

    ifZeroToJumpAfter = () => {
        const value = this.memoryEnv.getValue();
        if (value === 0) {
            const ptr = this.codeEnv.getPc();
            this.codeEnv.setPc(this.jumpTable[ptr]);
        }
    }

    ifNotZeroToJumpBefore = () => {
        const value = this.memoryEnv.getValue();
        if (value !== 0) {
            const ptr = this.codeEnv.getPc();
            this.codeEnv.setPc(this.jumpTable[ptr]);
        }
    }
}

let bf = new BrainFuck({
    io: {
        input: () => 'a', // TODO
        output: (char: string) => process.stdout.write(char),
    },
});

bf.run("+++++++++[>++++++++>+++++++++++>+++>+<<<<-]>.>++.+++++++..+++.>+++++.<<+++++++++++++++.>.+++.------.--------.>+.>+.");
