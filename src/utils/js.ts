
const _$_INVALID_IDENTIFIER_1 = "."
const _$_INVALID_IDENTIFIER_2 = "/"

const _$ = {
    'create.map'<T extends object>(dict: boolean = true) {
        const _map = Object.create(null);

        if(dict) {
            _map[_$_INVALID_IDENTIFIER_1] = 1
            _map[_$_INVALID_IDENTIFIER_2] = 1

            delete _map[_$_INVALID_IDENTIFIER_1]
            delete _map[_$_INVALID_IDENTIFIER_2]
        }

        return _map as T
    }
}

type _$_TType = typeof _$;

export function call<_TKey extends pFlex.TKeyOf<_$_TType, Function, false>>(method: _TKey, ...params: Parameters<_$_TType[_TKey]>): ReturnType<_$_TType[_TKey]> {
    const _fn = _$[method];
    return _fn.apply(_$, params)
}
export default _$
