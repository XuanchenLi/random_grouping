
export function chaoticRandom(): number{
    const MAX_PATH: number = 260
    let array = new Uint8Array(MAX_PATH)
    let randomArray = crypto.getRandomValues(array)
    let startUp = genRandInt(0, MAX_PATH - 1)
    // let theta = Math.sqrt(2)
    let token: number = chaoticFunction(Math.PI,
        randomArray[(startUp + 1) % MAX_PATH] / (randomArray[(startUp + 2) % MAX_PATH] + 0.01),
        randomArray[(startUp + 3) % MAX_PATH] % 2 + 1
        )
    token = 2.0 / Math.PI * Math.asin(Math.sqrt(token))
    return token
}


function genRandInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function chaoticFunction(z: number, theta: number, n: number) {
    return Math.pow(Math.sin(Math.PI * theta * Math.pow(z, n)), 2)
}
