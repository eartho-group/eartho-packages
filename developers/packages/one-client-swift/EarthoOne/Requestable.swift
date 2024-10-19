import Foundation

protocol Requestable {
    associatedtype ResultType
    associatedtype ErrorType: EarthoOneAPIError

    func start(_ callback: @escaping (Result<ResultType, ErrorType>) -> Void)
}
