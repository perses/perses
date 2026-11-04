class Perses < Formula
  desc 'Server and web UI for the CNCF sandbox for observability visualisation'
  homepage 'https://perses.dev'
  version '0.54.0'
  license 'Apache-2.0'

  if OS.linux?
    if Hardware::CPU.arm?
      url "https://github.com/perses/perses/releases/download/v#{version}/perses_#{version}_linux_arm64.tar.gz"
      sha256 '51e7f66e6e5af4d70d3ab92da6b5ef757368d620ba718e934a4fec225112a353'
    else
      url "https://github.com/perses/perses/releases/download/v#{version}/perses_#{version}_linux_amd64.tar.gz"
      sha256 '450a387501162fec8e36f0f2628be02ad994fefa989ad1e72a8889ce5eb12a4c'
    end
  else
    if Hardware::CPU.arm?
      url "https://github.com/perses/perses/releases/download/v#{version}/perses_#{version}_darwin_arm64.tar.gz"
      sha256 '6afacd914b5cc4aa42838007d894bf1aac9839b00e0b17e14d1ba986802ae01e'
    else
      url "https://github.com/perses/perses/releases/download/v#{version}/perses_#{version}_darwin_amd64.tar.gz"
      sha256 'afab7440088d6f805b38579b21de5661d531f4c2312ca3b555630eaeecd93f9a'
    end
  end

  def install
    bin.install 'perses'
    share.install 'plugins-archive'
    unless (pkgetc/'config.yml').exist?
      (pkgetc/'config.yml').write <<~CFG
        plugin:
          archive_path: #{opt_share}/plugins-archive
        database:
          file:
            folder: #{var}/perses
      CFG
    end
    Dir.mkdir(var/'perses') unless Dir.exist?(var/'perses')
  end

  service do
    run [opt_bin/'perses', "--config", etc/"perses/config.yml"]
    keep_alive true
    log_path var/"log/perses.log"
    error_log_path var/"log/perses.log"
    working_dir var/"perses"
  end

  test do
    port = free_port
    pid = fork do
      exec bin/'perses', "-config", etc/"perses/config.yml", "-web.listen-address", "localhost:#{port}"
    end
    sleep 5
    assert_match "Perses", shell_output("curl -s localhost:#{port}")
  ensure
    Process.kill('TERM', pid)
    Process.wait(pid)
  end
end
