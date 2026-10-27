import { ISize, Mat44 } from "@pTS://utils";

export class Camera {
    projection: Mat44;

    static transform(fov: number, near: number, far: number, size: ISize): Mat44 {
        const _bias_1 = (far + near) / (far - near);
        const _bias_2 = (2 * far * near) / (far - near);

        const _zoomX = 1 / Math.tan(fov / 2) * (Math.PI / 180);
        const _zoomY = _zoomX * (size.height / size.width);

        return new Mat44([
            _zoomX, 0, 0, 0,
            0, _zoomY, 0, 0,
            0, 0, _bias_1, -1,
            0, 0, _bias_2, 0
        ])
    }


}
