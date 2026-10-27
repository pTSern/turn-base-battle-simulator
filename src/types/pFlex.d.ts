
declare namespace pFlex {
    export type TPercent = number;
    export type TJsonString = string
    
    /**
     * TFunc: Dynamic function type.
     * Supports both explicit array of args and spread rest args.
     */
    export type TFunc<_TArgs = any[], _TReturn = any> = _TArgs extends any[] 
      ? (...args: _TArgs) => _TReturn 
      : (...args: _TArgs[]) => _TReturn;

    export namespace TTFunc {
        export type Void = TFunc<[void], void>;
        export type Fail = TFunc<[Error], void>;
    }

    /**
     * TCtor: Constructor type.
     * Handles abstract and concrete classes with specific instance types.
     */
    export type TCtor<_TArgs = any[], _TInstance = any, _TAbstract extends boolean = false> = _TAbstract extends false 
        ? _TArgs extends any[] ? new (...args: _TArgs) => _TInstance : new (...args: _TArgs[]) => _TInstance 
        : _TArgs extends any[] ? abstract new (...args: _TArgs) => _TInstance : abstract new (...args: _TArgs[]) => _TInstance;

    export type TCtorFlex<_TArgs = any[], _TInstance = any> = 
        (_TArgs extends any[] ? new (...args: _TArgs) => _TInstance : new (...args: _TArgs[]) => _TInstance) |
        (_TArgs extends any[] ? abstract new (...args: _TArgs) => _TInstance : abstract new (...args: _TArgs[]) => _TInstance);

    /**
     * IBinder: Context binder for functions.
     * _brgs: Prepended arguments.
     * _args: Appended arguments.
     */
    export interface IBinder<_TArgs = any[], _TReturn = any, _TBinder = any> {
        func: TFunc<_TArgs, _TReturn>;
        priority?: number;
        binder: _TBinder;
        args?: _TArgs;
    }

    /**
     * THandler: Flexible callback type.
     * Can be a raw function or a bound IBinder.
     */
    export type THandler<_TArgs = any[], _TReturn = any> = TFunc<_TArgs, _TReturn> | IBinder<_TArgs, _TReturn>;

    export type TKey = string | symbol | number;
    export type TArrays<TType> = (readonly TType[] | TType[]);
    export type TFlexReadonly<_TType> = _TType | Readonly<_TType>;

    export type TPrototype<_TType> = { prototype: _TType };
    export type TRecorder<_TKey extends TKey, _TValue = any> = Partial<Record<_TKey, _TValue>>;

    export type TArrayExtracter<_TKeys extends TKey[], _TValue = any> = { [K in _TKeys[number]]: _TValue };
    
    /**
     * TExtracter: Extracts property keys from an array of objects into a new record type.
     */
    export type TExtracter<_TObject extends readonly Object[], _TKeyof extends keyof _TObject[number], _TValue> = {
        [ _VKey in _TObject[number] as _VKey[_TKeyof] & string ]: _TValue;
    };

    /**
     * TStaticKeys: Extracts keys of static methods/properties from a target.
     */
    export type TStaticKeys<_TTarget> = {
        [_VK in keyof _TTarget] : _TTarget[_VK] extends Function ? _VK : never;
    }[keyof _TTarget];

    /**
     * TKeyOf: Advanced key extractor with condition filtering.
     */
    export type TKeyOf<_TTarget, _TCondition = any, _TExclude extends boolean = false> = {
        [_VK in keyof _TTarget]: 
            _TExclude extends true 
                ? (_TTarget[_VK] extends _TCondition ? never : _VK) 
                : (_TTarget[_VK] extends _TCondition ? _VK : never);
    }[keyof _TTarget];

    export type TStringRecord<_TKey extends TKey[], _TPartial extends boolean = false, _TReturn = string> = _TPartial extends true ? Partial<Record<_TKey[number], string>> : Record<_TKey[number], _TReturn>;

    /**
     * TArray: Union of a single item or an array of those items.
     */
    export type TArray<_TTarget, _TIsReadonly extends boolean = false> = _TTarget | ( _TIsReadonly extends true ? readonly _TTarget[] : _TTarget[] );

    export type TOption<_TData, _TKey extends TKeyOf<_TData>> = {
        key: _TKey;
        data: _TData[_TKey];
    };

    export type TArg<_TName extends string, _TType> = _TType | { [_VK in _TName]: _TType };

    export namespace Type {
        export type TByTo = 'by' | 'to';
        export type TOnOff = 'on' | 'off';
    }
}
