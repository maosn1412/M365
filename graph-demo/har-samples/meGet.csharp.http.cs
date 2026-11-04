// 来源：graph.microsoft.com_today_2026-11-03.har
// 请求：GET https://graph.microsoft.com/v1.0/me
// 说明：HAR 里没有 Authorization（Graph Explorer 不会导出令牌），令牌由代码自行注入。
// 生成时间：2026-11-03T01:58:12.346Z
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

public static class MeRequest
{
    private static readonly HttpClient Http = new();

    /// <summary>
    /// 调用 Microsoft Graph：GET https://graph.microsoft.com/v1.0/me
    /// </summary>
    /// <param name="accessToken">由 MSAL / Azure.Identity 获取的 Graph 访问令牌</param>
    public static async Task<string> SendAsync(string accessToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://graph.microsoft.com/v1.0/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await Http.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Graph 调用失败：{(int)response.StatusCode} {response.ReasonPhrase}\n{content}");
        }

        return content;
    }
}
